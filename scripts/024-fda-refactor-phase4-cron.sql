-- ==========================================
-- FDA REGISTRATION REFACTOR - PHASE 4: AUTO-STATUS UPDATES
-- ==========================================
-- Cron jobs to automatically update expired statuses

-- Function to auto-expire FDA registrations
CREATE OR REPLACE FUNCTION auto_expire_fda_registrations()
RETURNS void AS $$
BEGIN
  -- Update expired FDA registrations
  UPDATE fda_registrations
  SET 
    registration_status = 'expired',
    updated_at = NOW()
  WHERE 
    expiry_date < CURRENT_DATE
    AND registration_status = 'active';
    
  RAISE NOTICE 'Auto-expired % FDA registrations', (SELECT COUNT(*) FROM fda_registrations WHERE registration_status = 'expired' AND expiry_date < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire agent assignments
CREATE OR REPLACE FUNCTION auto_expire_agent_assignments()
RETURNS void AS $$
BEGIN
  -- Update expired agent assignments
  UPDATE agent_assignments
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    expiry_date < CURRENT_DATE
    AND status = 'active';
    
  RAISE NOTICE 'Auto-expired % agent assignments', (SELECT COUNT(*) FROM agent_assignments WHERE status = 'expired' AND expiry_date < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- This should be called by /api/cron/update-fda-status route daily
-- Example usage:
-- SELECT auto_expire_fda_registrations();
-- SELECT auto_expire_agent_assignments();

-- Add comment for documentation
COMMENT ON FUNCTION auto_expire_fda_registrations() IS 'Automatically marks FDA registrations as expired when past expiry_date. Call daily via cron.';
COMMENT ON FUNCTION auto_expire_agent_assignments() IS 'Automatically marks agent assignments as expired when past expiry_date. Call daily via cron.';
