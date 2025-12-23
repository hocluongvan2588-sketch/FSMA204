-- ULTIMATE RLS FIX v2 - Fix infinite recursion once and for all
-- Problem: Policies that query profiles table create infinite recursion
-- Solution: Use service role for admin operations, simple policies for regular users

-- ============================================
-- Step 1: Clean slate - Drop ALL existing policies
-- ============================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- ============================================
-- Step 2: Drop any recursive functions
-- ============================================
DROP FUNCTION IF EXISTS is_system_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin_jwt() CASCADE;
DROP FUNCTION IF EXISTS is_system_admin_jwt() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS sync_role_to_jwt() CASCADE;
DROP FUNCTION IF EXISTS update_user_context_cache() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;
DROP TABLE IF EXISTS user_context_cache CASCADE;

-- ============================================
-- Step 3: Create SIMPLE, NON-RECURSIVE policies
-- ============================================

-- Policy 1: Users can ALWAYS view their own profile
CREATE POLICY "view_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can UPDATE their own profile
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can INSERT their own profile during registration
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Step 4: Service role has FULL access (bypasses RLS)
-- ============================================
-- No policy needed - service_role automatically bypasses RLS
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO authenticated;

-- ============================================
-- Verification and Logging
-- ============================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'profiles';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'RLS FIX v2 APPLIED SUCCESSFULLY';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total policies created: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT CHANGES:';
    RAISE NOTICE '1. Removed ALL recursive RLS policies';
    RAISE NOTICE '2. Users can only access their OWN profile data';
    RAISE NOTICE '3. Admin operations MUST use service role client';
    RAISE NOTICE '4. Application layer handles authorization';
    RAISE NOTICE '';
    RAISE NOTICE 'Active policies:';
END $$;

SELECT 
  policyname AS "Policy Name",
  cmd AS "Command",
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END AS "Using",
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has CHECK clause'
    ELSE 'No CHECK clause'
  END AS "Check"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Log the fix
INSERT INTO system_logs (action, entity_type, description, metadata)
VALUES (
  'RLS_FIX',
  'profiles',
  'Applied ultimate RLS fix v2: Removed recursive policies, simplified to user-only access',
  jsonb_build_object(
    'version', '2.0',
    'date', NOW(),
    'changes', ARRAY[
      'Dropped all recursive policies',
      'Created 3 simple non-recursive policies',
      'Admin operations now use service role'
    ]
  )
)
ON CONFLICT DO NOTHING;
