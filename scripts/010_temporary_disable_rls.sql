-- TEMPORARY FIX: Disable RLS on profiles table to allow profile creation
-- This is a temporary measure while we fix the RLS policies properly
-- Run this ONLY if you're experiencing RLS infinite recursion errors

-- WARNING: This makes ALL profiles readable/writable by authenticated users temporarily
-- Only use in development or as emergency fix

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename = 'profiles';

-- IMPORTANT: After creating the necessary profiles, re-enable RLS with:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
