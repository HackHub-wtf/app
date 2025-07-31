-- Create storage bucket for team files
INSERT INTO storage.buckets (id, name, public) VALUES ('team-files', 'team-files', false);

-- Allow authenticated users to upload files to their team folders
CREATE POLICY "Team members can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'team-files' AND
  (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.user_id = auth.uid()
  )
);

-- Allow team members to view their team's files
CREATE POLICY "Team members can view team files" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'team-files' AND
  (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.user_id = auth.uid()
  )
);

-- Allow team members to delete their own files
CREATE POLICY "Team members can delete own files" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'team-files' AND
  (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.user_id = auth.uid()
  )
);

-- Create a table to store file metadata
CREATE TABLE public.file_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on file metadata
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file metadata
CREATE POLICY "Team members can view team file metadata" ON public.file_metadata FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = file_metadata.team_id AND user_id = (SELECT auth.uid()))
);

CREATE POLICY "Team members can create file metadata" ON public.file_metadata FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid()) AND
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = file_metadata.team_id AND user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can delete their own file metadata" ON public.file_metadata FOR DELETE USING (
  user_id = (SELECT auth.uid())
);

-- Create indexes
CREATE INDEX idx_file_metadata_team_id ON public.file_metadata(team_id);
CREATE INDEX idx_file_metadata_user_id ON public.file_metadata(user_id);

-- Enable realtime for file_metadata table
ALTER TABLE public.file_metadata REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_metadata;
