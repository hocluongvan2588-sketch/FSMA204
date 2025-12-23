-- Final cleanup for us_agents table
-- This consolidates all previous migration fixes

-- Step 1: Drop old columns that don't apply to independent agents
ALTER TABLE us_agents DROP COLUMN IF EXISTS service_start_date CASCADE;
ALTER TABLE us_agents DROP COLUMN IF EXISTS service_end_date CASCADE;
ALTER TABLE us_agents DROP COLUMN IF EXISTS notification_days_before CASCADE;
ALTER TABLE us_agents DROP COLUMN IF EXISTS notification_enabled CASCADE;

-- Step 2: Drop any indexes referencing removed columns
DROP INDEX IF EXISTS idx_us_agents_contract_end;

-- Step 3: Disable RLS temporarily to clear policies, then re-enable with correct policies
ALTER TABLE us_agents DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies that reference removed columns
DROP POLICY IF EXISTS "Agents can be viewed by System Admin and associated company admins" ON us_agents;
DROP POLICY IF EXISTS "System admin can manage all agents" ON us_agents;
DROP POLICY IF EXISTS "Manage agents" ON us_agents;

-- Step 5: Enable RLS again
ALTER TABLE us_agents ENABLE ROW LEVEL SECURITY;

-- Step 6: Create new, simplified policies
-- Policy 1: System Admin can do anything
CREATE POLICY "system_admin_manage_agents"
  ON us_agents
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Policy 2: Company admins can view agents through their facilities
CREATE POLICY "company_view_agents_via_facilities"
  ON us_agents
  FOR SELECT
  USING (
    id IN (
      SELECT us_agent_id FROM facilities 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Step 7: Update table comment
COMMENT ON TABLE us_agents IS 'US FDA Representatives/Agents are independent entities. They can be associated with multiple facilities through the facilities.us_agent_id foreign key. They do not have service date ranges or expiration tracking.';

COMMENT ON COLUMN us_agents.contract_status IS 'Status of the agent: active, inactive, or cancelled. These are independent representatives without time-bound contracts.';
