-- Fix infinite recursion in RLS policies for profiles table
-- Problem: is_system_admin() function queries profiles table, causing recursion
-- Solution: Use auth.jwt() to check role from JWT claims instead

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "System admin can create any profile" ON profiles;
DROP POLICY IF EXISTS "System admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "System admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Company admin can view company users" ON profiles;

-- Drop the recursive function
DROP FUNCTION IF EXISTS is_system_admin();

-- Create non-recursive helper functions using JWT claims
-- These functions check the role from the JWT token, not from the database
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Get role from JWT user_metadata
  RETURN COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'viewer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policy-friendly functions
CREATE OR REPLACE FUNCTION is_system_admin_jwt()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'system_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_jwt()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('system_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies without recursion
-- System admin policies
CREATE POLICY "System admin can create any profile" ON profiles
  FOR INSERT
  WITH CHECK (is_system_admin_jwt());

CREATE POLICY "System admin can view all profiles" ON profiles
  FOR SELECT
  USING (is_system_admin_jwt());

CREATE POLICY "System admin can update any profile" ON profiles
  FOR UPDATE
  USING (is_system_admin_jwt());

CREATE POLICY "System admin can delete any profile" ON profiles
  FOR DELETE
  USING (is_system_admin_jwt());

-- Regular users can still view and update their own profile
-- These policies already exist from 001_create_schema.sql, but let's ensure they work with system_admin too
-- The existing policies are:
-- "Users can view own profile" - allows auth.uid() = id
-- "Users can update own profile" - allows auth.uid() = id  
-- "Users can insert own profile" - allows auth.uid() = id

-- Company admin policies (view users in their company)
-- We need to avoid recursion here too, so we'll use a simpler approach
CREATE POLICY "Company admin can view company users" ON profiles
  FOR SELECT
  USING (
    -- Either you're viewing your own profile
    auth.uid() = id
    OR
    -- Or you're an admin/system_admin (from JWT) viewing users in your company
    (
      is_admin_jwt()
      AND company_id IN (
        SELECT p.company_id 
        FROM profiles p
        WHERE p.id = auth.uid()
      )
    )
  );

-- Update user metadata to ensure role is in JWT
-- This function will be called to sync role to JWT claims
CREATE OR REPLACE FUNCTION sync_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users metadata when profile role changes
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep JWT in sync
DROP TRIGGER IF EXISTS sync_role_to_jwt_trigger ON profiles;
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_jwt();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
