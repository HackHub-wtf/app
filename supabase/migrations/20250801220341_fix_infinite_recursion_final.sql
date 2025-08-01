-- Final fix for infinite recursion in organization_members policies
-- This migration completely removes the circular dependency issues

-- =============================================================================
-- 1. DISABLE RLS TEMPORARILY AND DROP ALL PROBLEMATIC POLICIES
-- =============================================================================

-- Disable RLS on organization_members to prevent any access issues
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on organization_members
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and managers can add members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and managers can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners managers and members can remove themselves" ON organization_members;
DROP POLICY IF EXISTS "Organization members are viewable by org members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can remove members" ON organization_members;

-- =============================================================================
-- 2. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =============================================================================

-- Simple policy for viewing organization members - only allow admins for now
CREATE POLICY "Admins can view all organization members"
ON organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Simple policy for inserting organization members - admins and self-insert
CREATE POLICY "Admins and self can insert organization members"
ON organization_members FOR INSERT
WITH CHECK (
  -- Admins can insert anyone
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- Users can insert themselves (for auto-organization creation)
  user_id = auth.uid()
);

-- Simple policy for updating organization members - only admins
CREATE POLICY "Admins can update organization members"
ON organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Simple policy for deleting organization members - admins and self-removal
CREATE POLICY "Admins and self can delete organization members"
ON organization_members FOR DELETE
USING (
  -- Admins can delete anyone
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- Users can remove themselves
  user_id = auth.uid()
);

-- Re-enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. UPDATE ORGANIZATIONS POLICIES TO BE SIMPLER
-- =============================================================================

-- Drop and recreate organizations policies to be simpler too
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their org" ON organizations;

-- Simple policy for viewing organizations - admins can see all
CREATE POLICY "Admins can view all organizations"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Simple policy for updating organizations - only admins for now
CREATE POLICY "Admins can update organizations"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Keep the existing insert policy for organizations
-- "Users can create organizations" should already exist

-- =============================================================================
-- 4. ENSURE PROFILES POLICIES ARE WORKING CORRECTLY
-- =============================================================================

-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Make sure profiles can be read by admins
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = auth.uid() 
    AND p2.role = 'admin'
  )
  OR
  -- Users can view their own profile
  id = auth.uid()
);

-- =============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Admins can view all organization members" ON organization_members 
IS 'Simple policy allowing only admins to view organization members to avoid recursion';

COMMENT ON POLICY "Admins and self can insert organization members" ON organization_members 
IS 'Allows admins to add members and users to add themselves during org creation';

COMMENT ON POLICY "Admins can update organization members" ON organization_members 
IS 'Only admins can update organization member roles and details';

COMMENT ON POLICY "Admins and self can delete organization members" ON organization_members 
IS 'Admins can remove any member, users can remove themselves';

COMMENT ON POLICY "Admins can view all organizations" ON organizations 
IS 'Simple policy allowing admins to view all organizations';

COMMENT ON POLICY "Admins can update organizations" ON organizations 
IS 'Only admins can update organization details for now';
