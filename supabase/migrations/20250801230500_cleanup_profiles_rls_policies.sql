-- Cleanup profiles RLS policies to remove recursive subqueries

-- Drop all existing RLS policies on profiles that use subselects
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can create non-admin profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can update team member profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate safe SELECT policy: everyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

-- Optional: Users can view their own profile (already covered by public, but explicit)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Note: Further INSERT/UPDATE/DELETE policies should be defined as needed without subqueries
