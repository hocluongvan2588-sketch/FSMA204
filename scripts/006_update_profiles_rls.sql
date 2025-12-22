-- Add RLS policy to allow system_admin to create profiles for other users
-- This is needed when system_admin creates new users from the admin panel

-- First, create a function to check if current user is system_admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'system_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add new policy for system_admin to insert profiles for other users
CREATE POLICY "System admin can create any profile" ON profiles
  FOR INSERT
  WITH CHECK (is_system_admin());

-- Add new policy for system_admin to view all profiles
CREATE POLICY "System admin can view all profiles" ON profiles
  FOR SELECT
  USING (is_system_admin());

-- Add new policy for system_admin to update any profile
CREATE POLICY "System admin can update any profile" ON profiles
  FOR UPDATE
  USING (is_system_admin());

-- Add new policy for company admin to view users in their company
CREATE POLICY "Company admin can view company users" ON profiles
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
