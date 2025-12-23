-- FIX COMPANY DATA ISSUES AND AMBIGUOUS COLUMN REFERENCE (FIXED)
-- Ensures company information is properly linked and visible

-- Step 1: Add a display_name column to companies if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN display_name TEXT;
    COMMENT ON COLUMN companies.display_name IS 'Display name set by system admin when creating company for admin users';
  END IF;
END $$;

-- Step 2: For existing companies without display_name, copy from name
UPDATE companies
SET display_name = name
WHERE display_name IS NULL;

-- Step 3: Create a view for complete company information
-- Fixed ambiguous column reference by adding table aliases to GROUP BY and using MAX() for subscription fields
CREATE OR REPLACE VIEW company_complete_info AS
SELECT 
  c.id,
  c.name,
  c.display_name,
  c.registration_number,
  c.address,
  c.phone,
  c.email,
  c.contact_person,
  c.created_at,
  c.updated_at,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT f.id) as total_facilities,
  COALESCE(MAX(cs.subscription_status), 'none') as subscription_status,
  COALESCE(MAX(cs.package_id::text), 'none') as package_id
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
LEFT JOIN facilities f ON f.company_id = c.id
LEFT JOIN company_subscriptions cs ON cs.company_id = c.id
GROUP BY c.id, c.name, c.display_name, c.registration_number, c.address, c.phone, 
         c.email, c.contact_person, c.created_at, c.updated_at;

-- Grant access to the view
GRANT SELECT ON company_complete_info TO authenticated;

-- Step 4: Ensure all profiles with company_id have valid company references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM profiles p
  WHERE p.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = p.company_id);
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned profiles with invalid company_id', orphaned_count;
  END IF;
END $$;

-- Step 5: Create a function to get company info for a user
CREATE OR REPLACE FUNCTION get_user_company_info(user_id UUID)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  company_display_name TEXT,
  registration_number TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.display_name,
    c.registration_number,
    c.address,
    c.phone,
    c.email,
    p.role
  FROM profiles p
  LEFT JOIN companies c ON c.id = p.company_id
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_company_info TO authenticated;

-- Log the fix
INSERT INTO system_logs (action, entity_type, description, metadata)
VALUES (
  'DATA_FIX',
  'companies',
  'Fixed company data structure: Added display_name, fixed ambiguous column reference in company_complete_info view',
  jsonb_build_object(
    'version', 2,
    'date', NOW()
  )
);

SELECT 'Company Data Fix Applied (v2)' AS status;
