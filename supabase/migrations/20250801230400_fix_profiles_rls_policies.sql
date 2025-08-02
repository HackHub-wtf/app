-- Fix infinite recursion in RLS policies for profiles

-- Enable row-level security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Managers can create non-admin profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate safe SELECT policies
CREATE POLICY "Public select profiles" ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Admin select all profiles" ON profiles
  FOR SELECT
  USING (auth.role() = 'admin');

-- Recreate safe UPDATE policy for users and admins
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL
  USING (auth.role() = 'admin');

-- Allow admins to delete any profiles explicitly
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE
  USING (auth.role() = 'admin');
