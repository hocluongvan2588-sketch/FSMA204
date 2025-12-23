-- CRITICAL SECURITY FIX: Enable RLS and proper policies for profiles table
-- This prevents data leakage between companies

-- Enable RLS on profiles table (CRITICAL!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing insecure policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 1. SYSTEM ADMINS can see ALL profiles
CREATE POLICY "System admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'system_admin'
  )
);

-- 2. COMPANY ADMINS can only see profiles from their own company
CREATE POLICY "Admins can view company profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admins can see users from their company only
  (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.company_id = profiles.company_id
      AND p.company_id IS NOT NULL
    )
  )
);

-- 3. MANAGERS, OPERATORS, VIEWERS can only see their own profile and colleagues
CREATE POLICY "Users can view own company profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  id = auth.uid()
  OR
  -- Users can see profiles from their company
  (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.company_id = profiles.company_id
      AND p.company_id IS NOT NULL
    )
  )
);

-- 4. INSERT: System admins and admins can create profiles
CREATE POLICY "System admins can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'system_admin'
  )
);

CREATE POLICY "Admins can insert company profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins can only create users for their own company
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.company_id = profiles.company_id
  )
  OR
  -- Users can insert their own profile during registration
  id = auth.uid()
);

-- 5. UPDATE: Users can update own profile, admins can update company users
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update company profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'system_admin')
    AND (
      p.role = 'system_admin'
      OR p.company_id = profiles.company_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'system_admin')
    AND (
      p.role = 'system_admin'
      OR p.company_id = profiles.company_id
    )
  )
);

-- 6. DELETE: Only system admins can delete (via admin API)
CREATE POLICY "System admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.role = 'system_admin'
  )
);

-- Log the security fix
INSERT INTO system_logs (action, entity_type, description, metadata)
VALUES (
  'SECURITY_FIX',
  'profiles',
  'Critical security fix: Enabled RLS and proper policies for profiles table to prevent data leakage between companies',
  jsonb_build_object(
    'version', 1,
    'date', NOW(),
    'policies_created', 9
  )
);

-- Display results
SELECT 
  'Profiles RLS Security Fix Applied' AS status,
  COUNT(*) AS total_policies
FROM pg_policies
WHERE tablename = 'profiles';
