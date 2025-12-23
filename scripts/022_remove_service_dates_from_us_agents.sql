-- Remove service_start_date and service_end_date from us_agents
-- Agents are independent entities without time-bound service contracts
-- Contract status is what matters for business logic

-- Drop columns
ALTER TABLE us_agents DROP COLUMN IF EXISTS service_start_date;
ALTER TABLE us_agents DROP COLUMN IF EXISTS service_end_date;

-- Drop notification_days_before since dates are removed
ALTER TABLE us_agents DROP COLUMN IF EXISTS notification_days_before;
ALTER TABLE us_agents DROP COLUMN IF EXISTS notification_enabled;

-- Simplify contract_status: agents are either active, inactive, or removed
-- No expiry logic needed

COMMENT ON COLUMN us_agents.contract_status IS 'Status of the agent: active, inactive, or cancelled. No expiration date tracking.';
