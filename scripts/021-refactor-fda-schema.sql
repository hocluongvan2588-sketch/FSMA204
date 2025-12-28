-- ================================================
-- FDA REGISTRATION SCHEMA REFACTOR - OPTION A
-- Link FDA registrations directly to companies
-- Remove US Agents company_id dependency
-- ================================================

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS fda_registrations_backup AS 
SELECT * FROM fda_registrations;

CREATE TABLE IF NOT EXISTS us_agents_backup AS 
SELECT * FROM us_agents;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE fda_registrations 
DROP CONSTRAINT IF EXISTS fda_registrations_facility_id_fkey;

ALTER TABLE us_agents
DROP CONSTRAINT IF EXISTS us_agents_company_id_fkey;

-- Step 3: Modify fda_registrations table
-- Add company_id and facility info columns
ALTER TABLE fda_registrations
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS facility_name TEXT,
ADD COLUMN IF NOT EXISTS facility_address TEXT,
ADD COLUMN IF NOT EXISTS facility_city TEXT,
ADD COLUMN IF NOT EXISTS facility_state TEXT,
ADD COLUMN IF NOT EXISTS facility_zip_code TEXT,
ADD COLUMN IF NOT EXISTS facility_country TEXT DEFAULT 'Vietnam',
ADD COLUMN IF NOT EXISTS owner_operator_name TEXT;

-- Migrate existing data: Get company_id from facility
UPDATE fda_registrations fr
SET 
  company_id = f.company_id,
  facility_name = f.name,
  facility_address = f.street_address,
  facility_city = f.city,
  facility_state = f.state_province,
  facility_zip_code = f.zip_code,
  owner_operator_name = c.name
FROM facilities f
LEFT JOIN companies c ON f.company_id = c.id
WHERE fr.facility_id = f.id
AND fr.company_id IS NULL;

-- Make company_id NOT NULL after migration
ALTER TABLE fda_registrations
ALTER COLUMN company_id SET NOT NULL;

-- Drop facility_id column (no longer needed)
ALTER TABLE fda_registrations
DROP COLUMN IF EXISTS facility_id;

-- Step 4: Create agent_assignments table
CREATE TABLE IF NOT EXISTS agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  us_agent_id UUID NOT NULL REFERENCES us_agents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fda_registration_id UUID REFERENCES fda_registrations(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  assignment_years INTEGER DEFAULT 1 CHECK (assignment_years > 0),
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (expiry_date > assignment_date)
);

-- Migrate existing agent data from fda_registrations
INSERT INTO agent_assignments (
  us_agent_id, 
  company_id, 
  fda_registration_id,
  assignment_date, 
  assignment_years,
  expiry_date,
  status
)
SELECT 
  fr.us_agent_id,
  fr.company_id,
  fr.id,
  fr.agent_registration_date,
  fr.registration_years,
  fr.agent_expiry_date,
  CASE 
    WHEN fr.agent_expiry_date < CURRENT_DATE THEN 'expired'
    ELSE 'active'
  END
FROM fda_registrations fr
WHERE fr.us_agent_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM agent_assignments aa 
  WHERE aa.fda_registration_id = fr.id
);

-- Step 5: Remove company_id from us_agents (agents are independent)
ALTER TABLE us_agents
DROP COLUMN IF EXISTS company_id;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fda_registrations_company_id 
ON fda_registrations(company_id);

CREATE INDEX IF NOT EXISTS idx_fda_registrations_status 
ON fda_registrations(registration_status);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id 
ON agent_assignments(us_agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_company_id 
ON agent_assignments(company_id);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_fda_reg_id 
ON agent_assignments(fda_registration_id);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_status 
ON agent_assignments(status);

-- Step 7: Create updated_at trigger for agent_assignments
CREATE OR REPLACE FUNCTION update_agent_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_assignments_updated_at
BEFORE UPDATE ON agent_assignments
FOR EACH ROW
EXECUTE FUNCTION update_agent_assignments_updated_at();

-- Step 8: Update RLS policies for fda_registrations
DROP POLICY IF EXISTS "fda_select_company" ON fda_registrations;
DROP POLICY IF EXISTS "fda_all_system" ON fda_registrations;

-- Users can view FDA registrations for their company
CREATE POLICY "fda_select_company" ON fda_registrations
FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

-- Only system admin can insert/update/delete
CREATE POLICY "fda_insert_system" ON fda_registrations
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() = 'system_admin');

CREATE POLICY "fda_update_system" ON fda_registrations
FOR UPDATE TO authenticated
USING (public.get_user_role() = 'system_admin');

CREATE POLICY "fda_delete_system" ON fda_registrations
FOR DELETE TO authenticated
USING (public.get_user_role() = 'system_admin');

-- Step 9: Create RLS policies for agent_assignments
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view agent assignments for their company
CREATE POLICY "agent_assignments_select" ON agent_assignments
FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

-- Only system admin can manage assignments
CREATE POLICY "agent_assignments_all_system" ON agent_assignments
FOR ALL TO authenticated
USING (public.get_user_role() = 'system_admin')
WITH CHECK (public.get_user_role() = 'system_admin');

-- Step 10: Update RLS policies for us_agents (system admin only)
DROP POLICY IF EXISTS "agent_all_admin" ON us_agents;
DROP POLICY IF EXISTS "agent_select_company" ON us_agents;

-- System admin can do everything
CREATE POLICY "agent_all_system_admin" ON us_agents
FOR ALL TO authenticated
USING (public.get_user_role() = 'system_admin')
WITH CHECK (public.get_user_role() = 'system_admin');

-- Regular users can view all agents (read-only)
CREATE POLICY "agent_select_all" ON us_agents
FOR SELECT TO authenticated
USING (true);

-- Step 11: Add comments for documentation
COMMENT ON TABLE fda_registrations IS 'FDA facility registrations linked to companies';
COMMENT ON COLUMN fda_registrations.company_id IS 'Company that owns this FDA registration';
COMMENT ON COLUMN fda_registrations.facility_name IS 'Name of the FDA-registered facility';
COMMENT ON COLUMN fda_registrations.owner_operator_name IS 'Legal owner/operator name (usually company name)';

COMMENT ON TABLE agent_assignments IS 'US Agent assignments to companies and FDA registrations';
COMMENT ON TABLE us_agents IS 'Independent US Agents (not tied to specific companies)';

-- Step 12: Verify data integrity
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Check for orphaned FDA registrations
  SELECT COUNT(*) INTO orphan_count
  FROM fda_registrations fr
  LEFT JOIN companies c ON fr.company_id = c.id
  WHERE c.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % orphaned FDA registrations without valid company_id', orphan_count;
  END IF;
  
  -- Check for orphaned agent assignments
  SELECT COUNT(*) INTO orphan_count
  FROM agent_assignments aa
  LEFT JOIN companies c ON aa.company_id = c.id
  WHERE c.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % orphaned agent assignments without valid company_id', orphan_count;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'FDA schema refactor completed successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - fda_registrations now links to companies instead of facilities';
  RAISE NOTICE '  - Facility info stored as text fields in fda_registrations';
  RAISE NOTICE '  - us_agents no longer has company_id (agents are independent)';
  RAISE NOTICE '  - New agent_assignments table tracks agent-company relationships';
  RAISE NOTICE '  - Updated RLS policies for proper access control';
END $$;
