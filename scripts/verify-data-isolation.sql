-- Script to verify data isolation between companies
-- Run this to check if RLS policies are working correctly

-- 1. Check current user's role and company
SELECT 
  id,
  email,
  role,
  company_id,
  full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = current_setting('request.jwt.claim.email', true);

-- 2. Verify company admins can only see their own company's users
-- This query should ONLY return users from the same company as the current admin
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.company_id,
  c.name as company_name,
  c.display_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- 3. Check if display_name is properly set for companies
SELECT 
  id,
  name,
  display_name,
  created_at,
  (SELECT COUNT(*) FROM profiles WHERE company_id = companies.id) as user_count
FROM companies
ORDER BY created_at DESC;

-- 4. Verify RLS policies are enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'companies', 'facilities', 'products')
ORDER BY tablename;

-- 5. List all active RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'companies')
ORDER BY tablename, policyname;
