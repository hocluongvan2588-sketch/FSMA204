-- ==========================================
-- FDA REGISTRATION REFACTOR - PHASE 1: BACKUP
-- ==========================================
-- Backup existing data before migration
-- Run this script first to ensure data safety

-- Backup fda_registrations table
CREATE TABLE IF NOT EXISTS fda_registrations_backup_20250128 AS 
SELECT * FROM fda_registrations;

-- Backup us_agents table
CREATE TABLE IF NOT EXISTS us_agents_backup_20250128 AS 
SELECT * FROM us_agents;

-- Backup facilities table (FDA fields only)
CREATE TABLE IF NOT EXISTS facilities_fda_backup_20250128 AS 
SELECT 
  id,
  company_id,
  name,
  fda_facility_number,
  fda_registration_date,
  fda_expiry_date,
  fda_status,
  agent_registration_date,
  agent_expiry_date
FROM facilities
WHERE fda_facility_number IS NOT NULL;

-- Verify backup counts
DO $$
BEGIN
  RAISE NOTICE 'Backup completed:';
  RAISE NOTICE '- fda_registrations: % rows', (SELECT COUNT(*) FROM fda_registrations_backup_20250128);
  RAISE NOTICE '- us_agents: % rows', (SELECT COUNT(*) FROM us_agents_backup_20250128);
  RAISE NOTICE '- facilities_fda: % rows', (SELECT COUNT(*) FROM facilities_fda_backup_20250128);
END $$;
