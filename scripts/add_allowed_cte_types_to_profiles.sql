-- =============================================
-- ADD allowed_cte_types column to profiles table
-- Issue: Code references this column but it doesn't exist
-- Solution: Add the missing column as JSONB array
-- =============================================

-- Add allowed_cte_types column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'allowed_cte_types'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN allowed_cte_types JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Added allowed_cte_types column to profiles table';
  ELSE
    RAISE NOTICE 'allowed_cte_types column already exists in profiles table';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.allowed_cte_types IS 'Array of allowed CTE (Critical Tracking Event) types for this user profile';
