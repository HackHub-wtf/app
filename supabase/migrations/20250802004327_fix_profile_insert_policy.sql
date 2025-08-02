-- Migration: Fix profile creation RLS policy
-- This allows authenticated users to create their own profiles during registration

-- First, check what policies exist and remove problematic ones
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create a comprehensive set of RLS policies for profiles

-- 1. SELECT policy: Users can view their own profile and public profiles
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT
  USING (
    -- Users can always view their own profile
    (SELECT auth.uid()) = id
    OR
    -- Everyone can view public profiles (for team listings, etc.)
    true
  );

-- 2. INSERT policy: Authenticated users can create their own profile only
CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT
  WITH CHECK (
    -- User can only create a profile with their own auth.uid()
    (SELECT auth.uid()) = id
  );

-- 3. UPDATE policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 4. DELETE policy: Only admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

-- 5. Additional INSERT policy for admins to create any profile
CREATE POLICY "Admins can create any profile" ON profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

-- 6. Additional UPDATE policy for admins to update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

-- Comment the policies
COMMENT ON POLICY "Users can view profiles" ON profiles IS 'Allows users to view their own profile and all public profiles';
COMMENT ON POLICY "Users can create their own profile" ON profiles IS 'Allows authenticated users to create their own profile during registration';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Allows users to update their own profile information';
COMMENT ON POLICY "Admins can delete profiles" ON profiles IS 'Only admin users can delete profiles';
COMMENT ON POLICY "Admins can create any profile" ON profiles IS 'Admin users can create profiles for any user';
COMMENT ON POLICY "Admins can update any profile" ON profiles IS 'Admin users can update any profile';
