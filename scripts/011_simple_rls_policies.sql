-- Simple RLS policies that avoid recursion
-- This replaces the complex policies that cause infinite recursion

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System admin can create any profile" ON profiles;
DROP POLICY IF EXISTS "System admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "System admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "System admin can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Company admin can view company users" ON profiles;

-- Simple policy: Users can ALWAYS read their own profile
-- No function calls, no recursion
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Simple policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Simple policy: Allow INSERT for authenticated users (for profile creation)
-- The application logic will handle who can create what
CREATE POLICY "Authenticated users can create profiles" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
