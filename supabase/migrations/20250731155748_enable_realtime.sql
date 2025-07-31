-- Enable realtime for all tables that need live updates

-- Enable realtime on hackathons table
ALTER TABLE public.hackathons REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hackathons;

-- Enable realtime on teams table
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;

-- Enable realtime on team_members table
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;

-- Enable realtime on ideas table
ALTER TABLE public.ideas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;

-- Enable realtime on idea_votes table
ALTER TABLE public.idea_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_votes;

-- Enable realtime on comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Enable realtime on chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime on notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime on profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
