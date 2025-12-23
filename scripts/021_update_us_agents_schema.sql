-- Remove service_start_date and service_end_date from us_agents table
-- These fields don't apply to independent agent entities

-- Drop the columns
ALTER TABLE us_agents DROP COLUMN IF EXISTS service_start_date;
ALTER TABLE us_agents DROP COLUMN IF EXISTS service_end_date;

-- Update the table comment to clarify the data model
COMMENT ON TABLE us_agents IS 'US FDA Agents are independent entities that can represent multiple foreign facilities. They are not owned by a company and have no service date ranges. Relationship is established through facilities.us_agent_id.';
