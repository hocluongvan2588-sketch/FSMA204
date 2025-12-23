-- Add INSERT policy for companies table
-- This allows authenticated users to create their own company

-- Drop existing policies to recreate them cleanly (if needed)
DROP POLICY IF EXISTS "Authenticated users can create company" ON companies;

-- Policy 1: Allow authenticated users to INSERT a company
-- WITH CHECK ensures the company is created with valid data
CREATE POLICY "Authenticated users can create company" ON companies
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy 2: Allow system admins to manage any company
DROP POLICY IF EXISTS "System admins can manage companies" ON companies;
CREATE POLICY "System admins can manage companies" ON companies
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'system_admin'
    )
  );

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;
