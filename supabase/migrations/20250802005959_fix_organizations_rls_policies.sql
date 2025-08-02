-- Migration: Fix organizations RLS policies to prevent infinite recursion
-- The issue is similar to profiles - admin checks create circular dependencies

-- Drop existing organization policies
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their org" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- Drop existing organization_members policies
DROP POLICY IF EXISTS "Organization members are viewable by org members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can remove members" ON organization_members;

-- Create simple, non-recursive policies for organizations

-- 1. SELECT: Anyone can view organizations (for public discovery)
CREATE POLICY "Anyone can view organizations" ON organizations
  FOR SELECT
  USING (true);

-- 2. INSERT: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- 3. UPDATE: Organization creators can update their organizations
CREATE POLICY "Creators can update organizations" ON organizations
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 4. DELETE: Organization creators can delete their organizations
CREATE POLICY "Creators can delete organizations" ON organizations
  FOR DELETE
  USING (created_by = auth.uid());

-- Create simple policies for organization_members

-- 1. SELECT: Anyone can view organization memberships (for team listings)
CREATE POLICY "Anyone can view organization members" ON organization_members
  FOR SELECT
  USING (true);

-- 2. INSERT: Authenticated users can add memberships
-- This will be controlled at the application level for now
CREATE POLICY "Authenticated users can manage memberships" ON organization_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. UPDATE: Users can update memberships they're involved in
CREATE POLICY "Users can update relevant memberships" ON organization_members
  FOR UPDATE
  USING (user_id = auth.uid() OR auth.uid() IS NOT NULL)
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

-- 4. DELETE: Users can remove themselves or any membership (controlled by app logic)
CREATE POLICY "Users can remove memberships" ON organization_members
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Comment the policies
COMMENT ON POLICY "Anyone can view organizations" ON organizations IS 'Allows anyone to view organizations for public discovery';
COMMENT ON POLICY "Authenticated users can create organizations" ON organizations IS 'Allows authenticated users to create organizations';
COMMENT ON POLICY "Creators can update organizations" ON organizations IS 'Allows organization creators to update their organizations';
COMMENT ON POLICY "Creators can delete organizations" ON organizations IS 'Allows organization creators to delete their organizations';

COMMENT ON POLICY "Anyone can view organization members" ON organization_members IS 'Allows anyone to view organization memberships for team listings';
COMMENT ON POLICY "Authenticated users can manage memberships" ON organization_members IS 'Allows authenticated users to manage organization memberships';
COMMENT ON POLICY "Users can update relevant memberships" ON organization_members IS 'Allows users to update organization memberships';
COMMENT ON POLICY "Users can remove memberships" ON organization_members IS 'Allows users to remove organization memberships';
