-- Add flexible voting criteria system
-- This allows hackathon managers to define custom voting criteria

-- Create voting_criteria table for hackathon-specific criteria
CREATE TABLE public.voting_criteria (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Innovation", "Technical Implementation", "Impact"
  description TEXT, -- e.g., "How innovative and creative is the solution?"
  weight INTEGER NOT NULL CHECK (weight > 0 AND weight <= 100), -- percentage weight (all criteria must sum to 100)
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hackathon_id, name)
);

-- Create idea_scores table for detailed scoring per criteria
CREATE TABLE public.idea_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  criteria_id UUID REFERENCES public.voting_criteria(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10), -- 1-10 scoring scale
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id, criteria_id) -- One score per user per criteria per idea
);

-- Add computed columns to ideas table for aggregated scores
ALTER TABLE public.ideas 
ADD COLUMN total_score DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN vote_count INTEGER DEFAULT 0;

-- Create function to calculate weighted scores
CREATE OR REPLACE FUNCTION calculate_idea_scores(idea_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_weighted_score DECIMAL(10,2) := 0;
  total_voters INTEGER := 0;
  criteria_record RECORD;
  avg_score DECIMAL(5,2);
  hackathon_uuid UUID;
BEGIN
  -- Get hackathon_id for the idea
  SELECT hackathon_id INTO hackathon_uuid FROM public.ideas WHERE id = idea_uuid;
  
  -- Calculate weighted score for each criteria
  FOR criteria_record IN 
    SELECT id, weight FROM public.voting_criteria WHERE hackathon_id = hackathon_uuid
  LOOP
    -- Get average score for this criteria
    SELECT COALESCE(AVG(score), 0) INTO avg_score 
    FROM public.idea_scores 
    WHERE idea_id = idea_uuid AND criteria_id = criteria_record.id;
    
    -- Add weighted score
    total_weighted_score := total_weighted_score + (avg_score * criteria_record.weight / 100.0);
  END LOOP;
  
  -- Get total number of unique voters for this idea
  SELECT COUNT(DISTINCT user_id) INTO total_voters 
  FROM public.idea_scores 
  WHERE idea_id = idea_uuid;
  
  -- Update the idea with calculated scores
  UPDATE public.ideas 
  SET 
    total_score = total_weighted_score,
    vote_count = total_voters,
    updated_at = NOW()
  WHERE id = idea_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to recalculate scores when scores are added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_recalculate_idea_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_idea_scores(OLD.idea_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_idea_scores(NEW.idea_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_scores_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.idea_scores
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_idea_scores();

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_voting_criteria_updated_at 
  BEFORE UPDATE ON public.voting_criteria 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_idea_scores_updated_at 
  BEFORE UPDATE ON public.idea_scores 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default criteria for existing hackathons (if any)
-- This provides a migration path for existing simple voting
INSERT INTO public.voting_criteria (hackathon_id, name, description, weight, display_order)
SELECT 
  id as hackathon_id,
  'Overall Innovation' as name,
  'Rate the overall innovation and creativity of this idea' as description,
  100 as weight,
  1 as display_order
FROM public.hackathons
WHERE NOT EXISTS (
  SELECT 1 FROM public.voting_criteria WHERE hackathon_id = public.hackathons.id
);

-- Migrate existing simple votes to the new scoring system
-- Convert each vote to a score of 8/10 in the default criteria
INSERT INTO public.idea_scores (idea_id, user_id, criteria_id, score)
SELECT 
  iv.idea_id,
  iv.user_id,
  vc.id as criteria_id,
  8 as score -- Convert vote to 8/10 score
FROM public.idea_votes iv
JOIN public.ideas i ON iv.idea_id = i.id
JOIN public.voting_criteria vc ON i.hackathon_id = vc.hackathon_id
WHERE vc.name = 'Overall Innovation'
ON CONFLICT (idea_id, user_id, criteria_id) DO NOTHING;

-- Update the vote counts after migration
DO $$
DECLARE
  idea_record RECORD;
BEGIN
  FOR idea_record IN SELECT id FROM public.ideas LOOP
    PERFORM calculate_idea_scores(idea_record.id);
  END LOOP;
END
$$;

-- RLS Policies for voting_criteria
ALTER TABLE public.voting_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voting criteria are viewable by everyone" 
  ON public.voting_criteria FOR SELECT USING (true);

CREATE POLICY "Hackathon managers can manage voting criteria" 
  ON public.voting_criteria FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hackathons 
      WHERE id = hackathon_id 
      AND created_by = (SELECT auth.uid())
    )
  );

-- RLS Policies for idea_scores
ALTER TABLE public.idea_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Idea scores are viewable by everyone" 
  ON public.idea_scores FOR SELECT USING (true);

CREATE POLICY "Users can score ideas" 
  ON public.idea_scores FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own scores" 
  ON public.idea_scores FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own scores" 
  ON public.idea_scores FOR DELETE USING ((SELECT auth.uid()) = user_id);
