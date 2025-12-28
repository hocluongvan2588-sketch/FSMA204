-- Fix subscription schema issues
-- Adds missing columns and constraints for ON CONFLICT operations

-- 1. Add missing columns to service_packages
ALTER TABLE service_packages 
ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;

COMMENT ON COLUMN service_packages.base_price IS 'Base price before any discounts or promotions';

-- Update base_price to match price_monthly for existing records
UPDATE service_packages 
SET base_price = price_monthly 
WHERE base_price IS NULL OR base_price = 0;

-- 2. Add missing columns to company_subscriptions
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS current_users_count INTEGER DEFAULT 0;

COMMENT ON COLUMN company_subscriptions.current_users_count IS 'Current number of users in this subscription';

-- Update current_users_count based on actual users in the company
UPDATE company_subscriptions cs
SET current_users_count = (
  SELECT COUNT(*) 
  FROM profiles p 
  WHERE p.company_id = cs.company_id
)
WHERE current_users_count = 0;

-- 3. Create unique constraint for active subscriptions
-- This allows ON CONFLICT operations when upserting active subscriptions
-- Only one active subscription per company at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_company 
ON company_subscriptions (company_id) 
WHERE status = 'active';

COMMENT ON INDEX unique_active_subscription_per_company IS 
'Ensures only one active subscription per company, enables ON CONFLICT for upserts';

-- 4. Verify the changes
SELECT 'service_packages columns:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'service_packages' 
  AND column_name IN ('id', 'base_price', 'price_monthly', 'price_yearly', 'max_users', 'max_facilities')
ORDER BY column_name;

SELECT 'company_subscriptions columns:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'company_subscriptions' 
  AND column_name IN ('id', 'company_id', 'current_users_count')
ORDER BY column_name;

SELECT 'Constraints and indexes:' as check_type;
SELECT 
    indexname as index_name,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'company_subscriptions' 
  AND indexname = 'unique_active_subscription_per_company';

-- Show summary
SELECT 'Schema fix completed successfully!' as message;
SELECT 'You can now use ON CONFLICT (company_id) WHERE status = ''active'' in your upsert queries' as usage_note;
