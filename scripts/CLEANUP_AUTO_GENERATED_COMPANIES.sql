-- Script to clean up auto-generated companies created by trigger
-- These are companies with names like "email@example.com Company"
-- Run this ONLY if you want to delete all auto-generated test companies

-- WARNING: This will delete companies and their subscriptions
-- Make sure to backup data before running this script

BEGIN;

-- Step 1: Find all auto-generated companies (those ending with " Company")
-- and have no users or facilities
WITH auto_generated_companies AS (
  SELECT c.id, c.name
  FROM companies c
  WHERE c.name LIKE '%@%.com Company'
    OR c.name LIKE '%@%.vn Company'
    OR c.registration_number LIKE 'REG-%'
)
SELECT 
  agc.id,
  agc.name,
  COUNT(DISTINCT p.id) as user_count,
  COUNT(DISTINCT f.id) as facility_count
FROM auto_generated_companies agc
LEFT JOIN profiles p ON p.company_id = agc.id
LEFT JOIN facilities f ON f.company_id = agc.id
GROUP BY agc.id, agc.name
HAVING COUNT(DISTINCT p.id) = 0 AND COUNT(DISTINCT f.id) = 0;

-- Step 2: Delete subscriptions for these companies
DELETE FROM company_subscriptions
WHERE company_id IN (
  SELECT c.id
  FROM companies c
  WHERE (c.name LIKE '%@%.com Company' OR c.name LIKE '%@%.vn Company' OR c.registration_number LIKE 'REG-%')
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE company_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM facilities WHERE company_id = c.id)
);

-- Step 3: Delete the auto-generated companies
DELETE FROM companies
WHERE (name LIKE '%@%.com Company' OR name LIKE '%@%.vn Company' OR registration_number LIKE 'REG-%')
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE company_id = companies.id)
  AND NOT EXISTS (SELECT 1 FROM facilities WHERE company_id = companies.id);

-- Show results
SELECT 'Cleanup completed. Auto-generated companies without users/facilities have been removed.' as message;

COMMIT;
