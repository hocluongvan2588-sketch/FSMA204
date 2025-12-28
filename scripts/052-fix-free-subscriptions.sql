-- Fix all FREE subscriptions to have correct status
-- This script corrects existing data issues

-- Step 1: Update all FREE subscriptions to have status = 'active'
UPDATE company_subscriptions cs
SET 
  status = 'active',
  price_paid = 0,
  end_date = (start_date + INTERVAL '100 years')::date
FROM service_packages sp
WHERE cs.package_id = sp.id
  AND sp.package_code = 'FREE'
  AND cs.status != 'active';

-- Step 2: Create FREE subscriptions for companies without any subscription
INSERT INTO company_subscriptions (
  company_id,
  package_id,
  status,
  billing_cycle,
  start_date,
  end_date,
  price_paid,
  auto_renew,
  created_at,
  updated_at
)
SELECT 
  c.id as company_id,
  (SELECT id FROM service_packages WHERE package_code = 'FREE' LIMIT 1) as package_id,
  'active' as status,
  'monthly' as billing_cycle,
  CURRENT_DATE as start_date,
  (CURRENT_DATE + INTERVAL '100 years')::date as end_date,
  0 as price_paid,
  false as auto_renew,
  now() as created_at,
  now() as updated_at
FROM companies c
LEFT JOIN company_subscriptions cs ON c.id = cs.company_id
WHERE cs.id IS NULL;

-- Output results
SELECT 
  'Fixed ' || COUNT(*) || ' FREE subscriptions' as status
FROM company_subscriptions cs
JOIN service_packages sp ON cs.package_id = sp.id
WHERE sp.package_code = 'FREE';

SELECT 
  c.name as company_name,
  cs.status,
  cs.price_paid,
  cs.start_date,
  cs.end_date,
  sp.package_code
FROM company_subscriptions cs
JOIN companies c ON cs.company_id = c.id
JOIN service_packages sp ON cs.package_id = sp.id
WHERE sp.package_code = 'FREE'
ORDER BY c.name;
