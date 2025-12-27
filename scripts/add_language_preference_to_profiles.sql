-- =============================================
-- ADD language_preference column to profiles table
-- Issue: Code references this column but it might not exist
-- Solution: Add the missing column with proper type and default
-- =============================================

-- Add language_preference column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'language_preference'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN language_preference TEXT DEFAULT 'vi';
    
    RAISE NOTICE 'Added language_preference column to profiles table';
  ELSE
    RAISE NOTICE 'language_preference column already exists in profiles table';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.language_preference IS 'User language preference (vi for Vietnamese, en for English)';
