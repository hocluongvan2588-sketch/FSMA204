-- =====================================================
-- RESET DATABASE - XÓA TOÀN BỘ DATABASE
-- =====================================================
-- Script này sẽ xóa sạch toàn bộ database
-- Chạy script này TRƯỚC KHI chạy lại các script khác
-- =====================================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Drop all triggers first
DROP TRIGGER IF EXISTS trigger_update_companies_timestamp ON companies CASCADE;
DROP TRIGGER IF EXISTS auto_deduct_inventory_on_cte ON critical_tracking_events CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_populate_kdes ON critical_tracking_events CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_cte_inventory_deduction ON critical_tracking_events CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_receiving_inventory ON critical_tracking_events CASCADE;
DROP TRIGGER IF EXISTS trigger_validate_chronological_order ON critical_tracking_events CASCADE;
DROP TRIGGER IF EXISTS validate_cte_chronological_order ON critical_tracking_events CASCADE;
DROP TRIGGER IF EXISTS trigger_update_facilities_timestamp ON facilities CASCADE;
DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON products CASCADE;
DROP TRIGGER IF EXISTS trigger_update_profiles_timestamp ON profiles CASCADE;
DROP TRIGGER IF EXISTS trigger_update_tlc_timestamp ON traceability_lots CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_chronological_order() CASCADE;
DROP FUNCTION IF EXISTS auto_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS handle_cte_inventory_deduction() CASCADE;
DROP FUNCTION IF EXISTS auto_populate_kde_fields() CASCADE;
DROP FUNCTION IF EXISTS handle_receiving_inventory() CASCADE;
DROP FUNCTION IF EXISTS validate_company_access() CASCADE;
DROP FUNCTION IF EXISTS check_subscription_status() CASCADE;
DROP FUNCTION IF EXISTS get_active_subscription() CASCADE;

-- Drop all tables (order matters due to foreign keys)
-- Drop dependent tables first
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS subscription_overrides CASCADE;
DROP TABLE IF EXISTS company_subscriptions CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS critical_tracking_events CASCADE;
DROP TABLE IF EXISTS key_data_elements CASCADE;
DROP TABLE IF EXISTS traceability_lot_codes CASCADE;
DROP TABLE IF EXISTS traceability_lots CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS fda_registrations CASCADE;
DROP TABLE IF EXISTS us_agents CASCADE;
DROP TABLE IF EXISTS facility_update_requests CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS service_packages CASCADE;

-- Drop any remaining objects
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS facility_type CASCADE;
DROP TYPE IF EXISTS facility_status CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Clear any cached data
NOTIFY pgrst, 'reload schema';

SELECT 'Database đã được xóa sạch! Bây giờ bạn có thể chạy lại các script theo thứ tự trong README.md' as message;
