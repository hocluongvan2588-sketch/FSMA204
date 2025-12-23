-- Add missing agent_expiry_date column to facilities table
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS agent_expiry_date DATE;

-- Add comment for clarity
COMMENT ON COLUMN facilities.agent_expiry_date IS 'Expiration date for US agent registration (calculated from agent_registration_date + years)';
