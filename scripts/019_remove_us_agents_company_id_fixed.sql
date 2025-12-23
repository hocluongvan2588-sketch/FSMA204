-- Remove company_id from us_agents table (FIXED)
-- US Agents are independent entities, not owned by any specific company
-- The relationship is through facilities.us_agent_id instead

-- First, drop the RLS policies that reference company_id on us_agents
DROP POLICY IF EXISTS "Users can view company agents" ON us_agents;
DROP POLICY IF EXISTS "Admins can manage agents" ON us_agents;

-- Set company_id to NULL for all existing records
UPDATE us_agents SET company_id = NULL;

-- Then drop the company_id column
ALTER TABLE us_agents DROP COLUMN IF EXISTS company_id;

-- Recreate RLS policies without company_id reference
CREATE POLICY "Users can view agents through facilities" ON us_agents FOR SELECT 
  USING (id IN (
    SELECT us_agent_id FROM facilities WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admins can manage agents through facilities" ON us_agents FOR ALL 
  USING (id IN (
    SELECT us_agent_id FROM facilities WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
    )
  ));

-- Add comment to table explaining the data model
COMMENT ON TABLE us_agents IS 'US FDA Agents are independent entities that can represent multiple foreign facilities. They are not owned by any company. Relationship is established through facilities.us_agent_id.';
