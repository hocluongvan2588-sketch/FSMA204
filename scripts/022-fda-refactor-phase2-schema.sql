-- ==========================================
-- FDA REGISTRATION REFACTOR - PHASE 2: SCHEMA CHANGES
-- ==========================================
-- Restructure tables according to Audit Plan A

-- Step 1: Create new agent_assignments junction table
CREATE TABLE IF NOT EXISTS agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  us_agent_id UUID NOT NULL REFERENCES us_agents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fda_registration_id UUID REFERENCES fda_registrations(id) ON DELETE SET NULL,
  assignment_date DATE NOT NULL,
  assignment_years INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent ON agent_assignments(us_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_company ON agent_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_fda ON agent_assignments(fda_registration_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_assignments(status);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_expiry ON agent_assignments(expiry_date);

-- Step 2: Modify fda_registrations table
-- Drop old facility_id FK and add company_id
ALTER TABLE fda_registrations DROP CONSTRAINT IF EXISTS fda_registrations_facility_id_fkey;
ALTER TABLE fda_registrations DROP COLUMN IF EXISTS facility_id;

-- Add new columns
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS facility_name TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS facility_address TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS facility_city TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS facility_state TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS facility_zip TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS facility_country TEXT DEFAULT 'USA';
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS owner_operator_name TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'active' CHECK (registration_status IN ('active', 'expired', 'suspended', 'cancelled'));
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS fei_number TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS duns_number TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS notification_days_before INTEGER DEFAULT 60;
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Remove US agent fields (moved to agent_assignments)
ALTER TABLE fda_registrations DROP COLUMN IF EXISTS us_agent_id;
ALTER TABLE fda_registrations DROP COLUMN IF EXISTS agent_registration_date;

-- Add audit fields
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE fda_registrations ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_fda_registrations_company ON fda_registrations(company_id);
CREATE INDEX IF NOT EXISTS idx_fda_registrations_status ON fda_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_fda_registrations_expiry ON fda_registrations(expiry_date);

-- Step 3: Modify us_agents table - remove company_id
ALTER TABLE us_agents DROP CONSTRAINT IF EXISTS us_agents_company_id_fkey;
ALTER TABLE us_agents DROP COLUMN IF EXISTS company_id;

-- Add audit fields if not exist
ALTER TABLE us_agents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE us_agents ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Step 4: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_assignments_updated_at BEFORE UPDATE ON agent_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fda_registrations_updated_at BEFORE UPDATE ON fda_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_us_agents_updated_at BEFORE UPDATE ON us_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Schema migration completed successfully';
  RAISE NOTICE 'New tables: agent_assignments';
  RAISE NOTICE 'Modified tables: fda_registrations (company-centric), us_agents (independent)';
END $$;
