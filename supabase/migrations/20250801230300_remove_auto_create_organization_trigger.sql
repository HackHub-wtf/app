-- Remove the auto_create_organization_trigger that causes foreign key constraint issues
-- when trying to manually create profiles

-- Drop the trigger
DROP TRIGGER IF EXISTS auto_create_organization_trigger ON profiles;

-- Drop the function as well
DROP FUNCTION IF EXISTS auto_create_organization_on_signup();
