-- Ensure all required columns exist in facilities table
-- This script is idempotent and safe to run multiple times

-- Add agent_registration_years column if it doesn't exist
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS agent_registration_years INTEGER DEFAULT 1;

COMMENT ON COLUMN facilities.agent_registration_years IS 'Number of years for US agent registration contract (1-10 years)';

-- Verify other required columns exist (they should from previous migrations)
-- agent_expiry_date should exist from script 026
-- fda_expiry_date should exist from previous scripts
-- agent_registration_date should exist from previous scripts

-- Update any null facility_type values to default production
UPDATE facilities 
SET facility_type = 'production' 
WHERE facility_type IS NULL;
