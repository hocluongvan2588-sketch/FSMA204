-- ==========================================
-- FDA REGISTRATION REFACTOR - PHASE 3: RLS POLICIES
-- ==========================================
-- Update Row Level Security policies for new schema

-- Enable RLS on new table
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "agent_select_company" ON us_agents;
DROP POLICY IF EXISTS "agent_all_admin" ON us_agents;
DROP POLICY IF EXISTS "fda_select_company" ON fda_registrations;
DROP POLICY IF EXISTS "fda_all_system" ON fda_registrations;

-- ===== US AGENTS POLICIES =====
-- Agents are independent entities, only system_admin can manage

CREATE POLICY "agents_select_all"
ON us_agents FOR SELECT
TO authenticated
USING (
  public.get_user_role() IN ('system_admin', 'admin')
);

CREATE POLICY "agents_insert_system_admin"
ON us_agents FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role() = 'system_admin'
);

CREATE POLICY "agents_update_system_admin"
ON us_agents FOR UPDATE
TO authenticated
USING (
  public.get_user_role() = 'system_admin'
);

CREATE POLICY "agents_delete_system_admin"
ON us_agents FOR DELETE
TO authenticated
USING (
  public.get_user_role() = 'system_admin'
);

-- ===== FDA REGISTRATIONS POLICIES =====
-- Company-centric: users see their company's registrations

CREATE POLICY "fda_select_company"
ON fda_registrations FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

CREATE POLICY "fda_insert_system_admin"
ON fda_registrations FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role() = 'system_admin'
);

CREATE POLICY "fda_update_system_admin"
ON fda_registrations FOR UPDATE
TO authenticated
USING (
  public.get_user_role() = 'system_admin'
);

CREATE POLICY "fda_delete_system_admin"
ON fda_registrations FOR DELETE
TO authenticated
USING (
  public.get_user_role() = 'system_admin'
);

-- ===== AGENT ASSIGNMENTS POLICIES =====
-- Users can see assignments for their company

CREATE POLICY "assignments_select_company"
ON agent_assignments FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

CREATE POLICY "assignments_all_system_admin"
ON agent_assignments FOR ALL
TO authenticated
USING (
  public.get_user_role() = 'system_admin'
);

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully';
  RAISE NOTICE '- us_agents: system_admin only management';
  RAISE NOTICE '- fda_registrations: company-scoped + system_admin';
  RAISE NOTICE '- agent_assignments: company-scoped + system_admin';
END $$;
