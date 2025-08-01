-- Migration: Add profile creation function to bypass RLS for seeding
-- This function allows creating profiles during database seeding without RLS restrictions

CREATE OR REPLACE FUNCTION create_profile_direct(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'participant'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, created_at, updated_at)
  VALUES (p_id, p_email, p_name, p_role, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users (needed for seeding scripts)
GRANT EXECUTE ON FUNCTION create_profile_direct(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_direct(UUID, TEXT, TEXT, TEXT) TO service_role;
