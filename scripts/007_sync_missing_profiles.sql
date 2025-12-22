-- Script to sync missing profiles for existing auth users
-- This will create profile records for any auth users that don't have one yet

DO $$
DECLARE
  user_record RECORD;
  default_role TEXT := 'viewer';
  user_role TEXT;
BEGIN
  -- Loop through all auth users
  FOR user_record IN 
    SELECT 
      u.id, 
      u.email,
      u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Get role from metadata or use default
    user_role := COALESCE(user_record.raw_user_meta_data ->> 'role', default_role);
    
    -- Insert profile for this user
    INSERT INTO profiles (
      id,
      full_name,
      role,
      language_preference,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data ->> 'full_name', user_record.email),
      user_role,
      COALESCE(user_record.raw_user_meta_data ->> 'language_preference', 'vi'),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created profile for user: % with role: %', user_record.email, user_role;
  END LOOP;
  
  -- Log summary
  RAISE NOTICE 'Profile sync completed';
END $$;

-- Verify the sync
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM profiles) as missing_profiles
FROM auth.users;
