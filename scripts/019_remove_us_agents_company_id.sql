-- Remove company_id from us_agents table
-- US Agents are independent entities, not owned by any specific company
-- The relationship is through facilities.us_agent_id instead

-- First, set company_id to NULL for all existing records
UPDATE us_agents SET company_id = NULL;

-- Then drop the company_id column
ALTER TABLE us_agents DROP COLUMN IF EXISTS company_id;

-- Add comment to table explaining the data model
COMMENT ON TABLE us_agents IS 'US FDA Agents are independent entities that can represent multiple foreign facilities. They are not owned by any company. Relationship is established through facilities.us_agent_id.';
