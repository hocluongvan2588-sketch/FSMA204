-- Create first system admin account
-- This script handles the complete setup including auth user and profile

-- IMPORTANT: Update these values before running
-- Email: admin@foodtrace.com
-- Password: Admin@123456
-- Full Name: System Administrator

-- Step 1: Create auth user using Supabase Auth Admin API
-- Note: This must be done through Supabase Dashboard or API, not SQL
-- Go to: Supabase Dashboard → Authentication → Users → Add User

-- Instructions:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create New User"
-- 3. Enter:
--    - Email: admin@foodtrace.com
--    - Password: Admin@123456
--    - Auto Confirm User: YES
--    - User Metadata (JSON):
--      {
--        "role": "system_admin",
--        "full_name": "System Administrator",
--        "language_preference": "vi"
--      }
-- 4. Click "Create User"
-- 5. Copy the User UID
-- 6. Run this SQL script replacing YOUR_USER_ID_HERE with the copied UID:

-- Step 2: Verify and create profile if needed
DO $$
DECLARE
  admin_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID from step 1
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_user_id) THEN
    -- Create profile for system admin
    INSERT INTO profiles (
      id,
      full_name,
      role,
      email,
      language_preference,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'System Administrator',
      'system_admin',
      'admin@foodtrace.com',
      'vi',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created system admin profile for user: %', admin_user_id;
  ELSE
    -- Update existing profile to system_admin
    UPDATE profiles 
    SET 
      role = 'system_admin',
      full_name = 'System Administrator',
      updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Updated existing profile to system_admin for user: %', admin_user_id;
  END IF;
  
  -- Sync role to JWT metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', 'system_admin',
      'full_name', 'System Administrator',
      'language_preference', 'vi'
    )
  WHERE id = admin_user_id;
  
  RAISE NOTICE 'Synced role to JWT for user: %', admin_user_id;
END $$;

-- Verify the setup
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as jwt_role,
  p.role as profile_role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@foodtrace.com';
