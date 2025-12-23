-- Make company_id nullable in us_agents since agents are independent entities
-- and don't have a company association at creation time
ALTER TABLE us_agents 
ALTER COLUMN company_id DROP NOT NULL;

-- Verify the change
COMMENT ON COLUMN us_agents.company_id IS 'Optional - only set if agent is affiliated with a company';
