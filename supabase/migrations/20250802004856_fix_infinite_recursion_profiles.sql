-- Migration: Fix infinite recursion in profile policies
-- The issue is that admin policies were checking the profiles table from within profile policies
-- This creates circular dependency. We need simpler, non-recursive policies.

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create simple, non-recursive policies

-- 1. SELECT policy: Anyone can view profiles (for team listings, public info)
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT
  USING (true);

-- 2. INSERT policy: Authenticated users can create profiles
-- Keep it simple - just check they are authenticated
CREATE POLICY "Authenticated users can create profiles" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. UPDATE policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. DELETE policy: Users can delete their own profile
-- For now, allow users to delete their own profiles
-- We can restrict this later if needed
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Comment the policies for documentation
COMMENT ON POLICY "Anyone can view profiles" ON profiles IS 'Allows anyone to view profile information for team listings and public display';
COMMENT ON POLICY "Authenticated users can create profiles" ON profiles IS 'Allows any authenticated user to create a profile';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Allows users to update only their own profile information';
COMMENT ON POLICY "Users can delete own profile" ON profiles IS 'Allows users to delete only their own profile';
