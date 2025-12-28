-- =============================================
-- ADD MISSING COLUMNS TO PROFILES TABLE
-- Issue: organization_type and allowed_cte_types columns missing
-- =============================================

-- Add organization_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'organization_type'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN organization_type TEXT;
    
    RAISE NOTICE 'Added organization_type column to profiles table';
  ELSE
    RAISE NOTICE 'organization_type column already exists';
  END IF;
END $$;

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
    ADD COLUMN allowed_cte_types TEXT[];
    
    RAISE NOTICE 'Added allowed_cte_types column to profiles table';
  ELSE
    RAISE NOTICE 'allowed_cte_types column already exists';
  END IF;
END $$;

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
    RAISE NOTICE 'language_preference column already exists';
  END IF;
END $$;

-- Add comments to document the columns
COMMENT ON COLUMN public.profiles.organization_type IS 'Type of organization (farm, packing_house, processor, distributor, retailer, port_operator)';
COMMENT ON COLUMN public.profiles.allowed_cte_types IS 'Array of allowed CTE event types for this user based on their organization type';
COMMENT ON COLUMN public.profiles.language_preference IS 'User language preference (vi or en)';

-- Update existing users with default organization_type if needed
-- UPDATE public.profiles 
-- SET organization_type = 'farm' 
-- WHERE organization_type IS NULL;

SELECT 'Migration completed: Added missing columns to profiles table' as message;
