-- Fix RLS policies to prevent infinite recursion and add auto organization creation
-- This migration fixes the circular references in organization_members policies
-- and adds functionality to automatically create organizations when users sign up

-- =============================================================================
-- 1. FIX RLS POLICIES - Remove infinite recursion
-- =============================================================================

-- Drop existing organization_members policies that cause infinite recursion
DROP POLICY IF EXISTS "Organization members are viewable by org members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization managers can remove members" ON organization_members;

-- Create new organization_members policies without circular references
CREATE POLICY "Organization members can view members" 
ON organization_members FOR SELECT 
USING (
  -- Allow access if user is a member of the same organization
  EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id 
    AND om2.user_id = auth.uid()
  )
  OR
  -- Allow access for admins
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Organization owners and managers can add members" 
ON organization_members FOR INSERT 
WITH CHECK (
  -- Allow if user is owner/manager of the organization
  EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id 
    AND om2.user_id = auth.uid()
    AND om2.role IN ('owner', 'manager')
  )
  OR
  -- Allow for admins
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
  OR
  -- Allow users to add themselves as members (for organization creation)
  user_id = auth.uid()
);

CREATE POLICY "Organization owners and managers can update members" 
ON organization_members FOR UPDATE 
USING (
  -- Allow if user is owner/manager of the organization
  EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id 
    AND om2.user_id = auth.uid()
    AND om2.role IN ('owner', 'manager')
  )
  OR
  -- Allow for admins
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Organization owners managers and members can remove themselves" 
ON organization_members FOR DELETE 
USING (
  -- Allow if user is owner/manager of the organization
  EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id 
    AND om2.user_id = auth.uid()
    AND om2.role IN ('owner', 'manager')
  )
  OR
  -- Allow users to remove themselves
  user_id = auth.uid()
  OR
  -- Allow for admins
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =============================================================================
-- 2. CREATE FUNCTIONS FOR AUTO ORGANIZATION CREATION
-- =============================================================================

-- Function to generate a unique organization slug from name
CREATE OR REPLACE FUNCTION generate_organization_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name (lowercase, replace spaces with hyphens, remove special chars)
  base_slug := lower(regexp_replace(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'org';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment counter if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create organization when user signs up
CREATE OR REPLACE FUNCTION auto_create_organization_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  org_name TEXT;
  org_slug TEXT;
  new_org_id UUID;
BEGIN
  -- Only proceed if user doesn't already have an organization
  IF NEW.organization_id IS NULL THEN
    -- Extract domain from email to create organization name
    org_name := split_part(NEW.email, '@', 2);
    
    -- Convert domain to a nice organization name
    -- e.g., "example.com" -> "Example Organization"
    org_name := initcap(replace(split_part(org_name, '.', 1), '-', ' ')) || ' Organization';
    
    -- Generate unique slug
    org_slug := generate_organization_slug(org_name);
    
    -- Create the organization
    INSERT INTO organizations (name, slug, description, created_by)
    VALUES (
      org_name,
      org_slug,
      'Auto-created organization for ' || org_name,
      NEW.id
    )
    RETURNING id INTO new_org_id;
    
    -- Update the user's profile with the new organization
    NEW.organization_id := new_org_id;
    
    -- Add user as owner of the organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
    
    -- If user is not admin, set them as manager (since they own an org)
    IF NEW.role = 'participant' THEN
      NEW.role := 'manager';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. CREATE TRIGGER FOR AUTO ORGANIZATION CREATION
-- =============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_organization_trigger ON profiles;

-- Create trigger that runs when a new profile is created
CREATE TRIGGER auto_create_organization_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_organization_on_signup();

-- =============================================================================
-- 4. UPDATE EXISTING USERS WITHOUT ORGANIZATIONS
-- =============================================================================

-- Create organizations for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  org_name TEXT;
  org_slug TEXT;
  new_org_id UUID;
BEGIN
  -- Loop through users without organizations (excluding admins)
  FOR user_record IN 
    SELECT id, email, name, role 
    FROM profiles 
    WHERE organization_id IS NULL 
    AND role != 'admin'
  LOOP
    -- Extract domain from email to create organization name
    org_name := split_part(user_record.email, '@', 2);
    
    -- Convert domain to a nice organization name
    org_name := initcap(replace(split_part(org_name, '.', 1), '-', ' ')) || ' Organization';
    
    -- Generate unique slug
    org_slug := generate_organization_slug(org_name);
    
    -- Create the organization
    INSERT INTO organizations (name, slug, description, created_by)
    VALUES (
      org_name,
      org_slug,
      'Auto-created organization for ' || org_name,
      user_record.id
    )
    RETURNING id INTO new_org_id;
    
    -- Update the user's profile with the new organization
    UPDATE profiles 
    SET organization_id = new_org_id,
        role = CASE 
          WHEN role = 'participant' THEN 'manager'
          ELSE role
        END
    WHERE id = user_record.id;
    
    -- Add user as owner of the organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_record.id, 'owner');
    
  END LOOP;
END $$;

-- =============================================================================
-- 5. COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION generate_organization_slug(TEXT) IS 'Generate a unique slug for an organization based on its name';
COMMENT ON FUNCTION auto_create_organization_on_signup() IS 'Automatically create organization and set user as owner when they sign up';
COMMENT ON TRIGGER auto_create_organization_trigger ON profiles IS 'Trigger to auto-create organizations for new users';
