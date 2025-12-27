-- =============================================
-- ADD organization_type column to profiles table
-- Issue: column profiles.organization_type does not exist
-- Solution: Add the missing column with proper type and default
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
    RAISE NOTICE 'organization_type column already exists in profiles table';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.organization_type IS 'Type of organization (farm, processing_facility, exporter, etc.)';

-- Optional: Update existing null values to a default if needed
-- UPDATE public.profiles 
-- SET organization_type = 'farm' 
-- WHERE organization_type IS NULL;
