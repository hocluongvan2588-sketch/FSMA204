-- =====================================================
-- DISABLE AUTO-CREATE COMPANY TRIGGER
-- =====================================================
-- This script disables the automatic company creation when a user is created.
-- System admins should manually create companies first, then assign users to them.
--
-- Run this script to fix the issue where every new user gets their own company.
-- After running this, users will need to be assigned to existing companies via the admin UI.

-- Drop the trigger that auto-creates companies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that auto-creates companies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Auto-create company trigger has been DISABLED';
  RAISE NOTICE '';
  RAISE NOTICE 'From now on:';
  RAISE NOTICE '1. System Admin creates companies first via admin UI';
  RAISE NOTICE '2. System Admin creates users and assigns them to existing companies';
  RAISE NOTICE '3. Multiple users can belong to the same company';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Users created via admin UI will still work normally.';
  RAISE NOTICE 'Only users created directly from Supabase dashboard will NOT have a profile.';
END $$;
