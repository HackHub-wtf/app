-- Migration: Remove problematic handle_new_user trigger and function
-- We'll handle profile creation manually in the seeding scripts instead

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS handle_new_user();
