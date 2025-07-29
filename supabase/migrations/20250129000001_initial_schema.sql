-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
-- Note: Foreign key constraint will be added after seed data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'participant')) DEFAULT 'participant',
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hackathons table
CREATE TABLE public.hackathons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_key TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'open', 'running', 'completed')) DEFAULT 'draft',
  max_team_size INTEGER NOT NULL DEFAULT 4,
  allowed_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  banner_url TEXT,
  rules TEXT,
  prizes TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_open BOOLEAN DEFAULT true,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, hackathon_id)
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('leader', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  votes INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'submitted', 'in-progress', 'completed')) DEFAULT 'draft',
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create idea_votes table
CREATE TABLE public.idea_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'system')) DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = '';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON public.hackathons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update idea votes count
CREATE OR REPLACE FUNCTION update_idea_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ideas 
    SET votes = votes + 1 
    WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ideas 
    SET votes = votes - 1 
    WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = '';

-- Create trigger for vote counting
CREATE TRIGGER update_idea_votes_count_trigger
  AFTER INSERT OR DELETE ON public.idea_votes
  FOR EACH ROW EXECUTE PROCEDURE update_idea_votes_count();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);

-- RLS Policies for hackathons
CREATE POLICY "Hackathons are viewable by everyone" ON public.hackathons FOR SELECT USING (true);
CREATE POLICY "Managers can create hackathons" ON public.hackathons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
);
CREATE POLICY "Creators can update their hackathons" ON public.hackathons FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);
CREATE POLICY "Team creators can update their teams" ON public.teams FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- RLS Policies for team_members
CREATE POLICY "Team members are viewable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for ideas
CREATE POLICY "Ideas are viewable by everyone" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Users can create ideas" ON public.ideas FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);
CREATE POLICY "Creators can update their ideas" ON public.ideas FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- RLS Policies for idea_votes
CREATE POLICY "Votes are viewable by everyone" ON public.idea_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on ideas" ON public.idea_votes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can remove their votes" ON public.idea_votes FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their comments" ON public.comments FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Team members can view team messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = chat_messages.team_id AND user_id = (SELECT auth.uid()))
);
CREATE POLICY "Team members can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user_id AND 
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = chat_messages.team_id AND user_id = (SELECT auth.uid()))
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Create indexes for performance
CREATE INDEX idx_hackathons_status ON public.hackathons(status);
CREATE INDEX idx_hackathons_created_by ON public.hackathons(created_by);
CREATE INDEX idx_teams_hackathon_id ON public.teams(hackathon_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_ideas_hackathon_id ON public.ideas(hackathon_id);
CREATE INDEX idx_ideas_team_id ON public.ideas(team_id);
CREATE INDEX idx_idea_votes_idea_id ON public.idea_votes(idea_id);
CREATE INDEX idx_comments_idea_id ON public.comments(idea_id);
CREATE INDEX idx_chat_messages_team_id ON public.chat_messages(team_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Add foreign key constraint for profiles table
-- This ensures referential integrity with auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
