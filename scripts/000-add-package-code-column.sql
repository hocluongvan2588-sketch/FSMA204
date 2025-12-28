-- =============================================
-- MIGRATION: Add package_code column to service_packages
-- Purpose: Add unique identifier column for reliable package lookups
-- Run this BEFORE 001-seed-service-packages.sql
-- =============================================

-- Step 1: Add the column (nullable first)
ALTER TABLE service_packages 
ADD COLUMN IF NOT EXISTS package_code TEXT;

-- Step 2: Populate existing records based on name
UPDATE service_packages 
SET package_code = CASE
  WHEN LOWER(name) LIKE '%free%' OR price_monthly = 0 THEN 'FREE'
  WHEN LOWER(name) LIKE '%starter%' OR LOWER(name) LIKE '%basic%' THEN 'STARTER'
  WHEN LOWER(name) LIKE '%professional%' OR LOWER(name) LIKE '%pro%' THEN 'PROFESSIONAL'
  WHEN LOWER(name) LIKE '%business%' THEN 'BUSINESS'
  WHEN LOWER(name) LIKE '%enterprise%' THEN 'ENTERPRISE'
  ELSE UPPER(SUBSTRING(name FROM 1 FOR 10)) -- Fallback: first 10 chars uppercase
END
WHERE package_code IS NULL;

-- Step 3: Add unique constraint
ALTER TABLE service_packages 
ADD CONSTRAINT service_packages_package_code_unique UNIQUE (package_code);

-- Step 4: Add NOT NULL constraint after populating
ALTER TABLE service_packages 
ALTER COLUMN package_code SET NOT NULL;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_packages_package_code 
ON service_packages(package_code);

-- Verification
DO $$
DECLARE
  rec RECORD;
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM service_packages WHERE package_code IS NOT NULL;
  RAISE NOTICE 'Migration complete: % packages have package_code', v_count;
  
  -- Show the mapping
  RAISE NOTICE 'Package Code Mappings:';
  FOR rec IN (SELECT package_code, name, price_monthly FROM service_packages ORDER BY display_order)
  LOOP
    RAISE NOTICE '  % -> % ($%/month)', rec.package_code, rec.name, rec.price_monthly;
  END LOOP;
END $$;
