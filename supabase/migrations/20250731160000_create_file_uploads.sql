-- Create file_uploads table
CREATE TABLE public.file_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_uploads
CREATE POLICY "Team members can view team files" ON public.file_uploads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = file_uploads.team_id 
    AND tm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Team members can upload files" ON public.file_uploads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = file_uploads.team_id 
    AND tm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete own files" ON public.file_uploads FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- Create indexes
CREATE INDEX idx_file_uploads_team_id ON public.file_uploads(team_id);
CREATE INDEX idx_file_uploads_user_id ON public.file_uploads(user_id);

-- Enable realtime for file_uploads
ALTER TABLE public.file_uploads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_uploads;
