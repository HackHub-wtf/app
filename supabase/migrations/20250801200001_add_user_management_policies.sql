-- Add RLS policies for user management by admins and managers

-- Allow admins to insert new profiles
CREATE POLICY "Admins can create profiles" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Allow managers to insert new profiles (but not admin roles)
CREATE POLICY "Managers can create non-admin profiles" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
  AND NEW.role != 'admin'
);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Allow managers to update profiles of users in their hackathons
CREATE POLICY "Managers can update team member profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
  AND (
    -- Allow updating own profile
    id = (SELECT auth.uid())
    OR
    -- Allow updating profiles of users in manager's hackathons
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.teams t ON tm.team_id = t.id
      JOIN public.hackathons h ON t.hackathon_id = h.id
      WHERE tm.user_id = profiles.id 
      AND h.created_by = (SELECT auth.uid())
    )
  )
);

-- Allow admins to delete any profile (except their own)
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  AND id != (SELECT auth.uid())
);
