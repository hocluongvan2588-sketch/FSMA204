-- Fix RLS policy on companies table to allow admins to see all companies
-- This enables the facility form to show all companies in the dropdown

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own company" ON companies;

-- Create new policies for companies SELECT
-- 1. Regular users can see their own company
CREATE POLICY "Users can view own company" ON companies FOR SELECT 
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 2. System admins can see all companies (for management purposes)
CREATE POLICY "System admins can view all companies" ON companies FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

-- 3. Company admins can see their company (for company management)
-- This is already covered by the "Users can view own company" policy above
-- since company admins have their company_id set in profiles

-- Update the existing "System admins can manage companies" policy to ensure it covers SELECT
DROP POLICY IF EXISTS "System admins can manage companies" ON companies;
CREATE POLICY "System admins can manage all companies" ON companies FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin'));

-- Verify policies are in place
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;
