-- VERIFICATION SCRIPT: Check security settings

-- 1. Verify RLS is enabled on profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. List all policies on profiles table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Test query: Count profiles by company (should respect RLS)
SELECT 
  c.name AS company_name,
  COUNT(p.id) AS user_count
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 4. Check for profiles without company (potential security issue)
SELECT 
  COUNT(*) AS users_without_company,
  COUNT(*) FILTER (WHERE role = 'admin') AS admins_without_company,
  COUNT(*) FILTER (WHERE role = 'system_admin') AS system_admins
FROM profiles
WHERE company_id IS NULL;

-- 5. Verify company data completeness
SELECT 
  name,
  display_name,
  CASE 
    WHEN registration_number IS NULL THEN 'Missing registration'
    WHEN address IS NULL THEN 'Missing address'
    WHEN phone IS NULL THEN 'Missing phone'
    WHEN email IS NULL THEN 'Missing email'
    ELSE 'Complete'
  END AS data_status
FROM companies
ORDER BY name;

SELECT 'Security Verification Complete' AS status;
