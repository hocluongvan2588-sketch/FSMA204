-- ============================================================================
-- FoodTrace FSMA 204 - Complete Idempotent Seed Data
-- ============================================================================

-- Tạm dừng trigger để tránh lỗi Audit và Permission
SET session_replication_role = 'replica';

-- ============================================================================
-- SECTION 0: CLEANUP (Chỉ giữ lại 2 công ty demo)
-- ============================================================================
-- Xóa tất cả công ty không phải là VNTEETH hoặc Viet Fresh
-- Sử dụng CASCADE để xóa các bản ghi liên quan ở các bảng con tự động
DELETE FROM companies 
WHERE id NOT IN (
    '550e8400-e29b-41d4-a716-446655440001', -- VNTEETH
    '550e8400-e29b-41d4-a716-446655440002'  -- Viet Fresh
);

-- ============================================================================
-- SECTION 1: SERVICE PACKAGES
-- ============================================================================

INSERT INTO service_packages (
    package_code, package_name, package_name_vi,
    description, description_vi,
    price_monthly, price_yearly, price_currency,
    includes_cte_tracking, includes_fda_management, includes_agent_management, includes_reporting,
    max_facilities, max_users, max_products, max_storage_gb,
    is_active, is_featured, sort_order
)
SELECT 'BASIC', 'Basic Plan', 'Gói Cơ Bản', 'For small farms', 'Dành cho trang trại nhỏ', 29.99, 299.90, 'USD', true, false, false, false, 3, 2, 10, 5, true, false, 1
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE package_code = 'BASIC');

INSERT INTO service_packages (
    package_code, package_name, package_name_vi,
    description, description_vi,
    price_monthly, price_yearly, price_currency,
    includes_cte_tracking, includes_fda_management, includes_agent_management, includes_reporting,
    max_facilities, max_users, max_products, max_storage_gb,
    is_active, is_featured, sort_order
)
SELECT 'PROFESSIONAL', 'Professional Plan', 'Gói Chuyên Nghiệp', 'For medium processors', 'Dành cho nhà xử lý vừa', 79.99, 799.90, 'USD', true, true, false, true, 10, 10, 50, 50, true, true, 2
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE package_code = 'PROFESSIONAL');

INSERT INTO service_packages (
    package_code, package_name, package_name_vi,
    description, description_vi,
    price_monthly, price_yearly, price_currency,
    includes_cte_tracking, includes_fda_management, includes_agent_management, includes_reporting,
    max_facilities, max_users, max_products, max_storage_gb,
    is_active, is_featured, sort_order
)
SELECT 'ENTERPRISE', 'Enterprise Plan', 'Gói Enterprise', 'For large companies', 'Dành cho công ty lớn', 199.99, 1999.90, 'USD', true, true, true, true, 9999, 9999, 9999, 500, true, false, 3
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE package_code = 'ENTERPRISE');

-- ============================================================================
-- SECTION 2: COMPANIES
-- ============================================================================

INSERT INTO companies (id, name, display_name, registration_number, contact_person, email, phone, address)
SELECT '550e8400-e29b-41d4-a716-446655440001'::UUID, 'VNTEETH Co., Ltd.', 'VNTEETH', 'VNTEETH-2024-001', 'Trần Văn A', 'info@vnteeth.vn', '+84-28-1234-5678', '123 Nguyễn Hữu Cảnh, TP.HCM'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = '550e8400-e29b-41d4-a716-446655440001'::UUID);

INSERT INTO companies (id, name, display_name, registration_number, contact_person, email, phone, address)
SELECT '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Viet Fresh Logistics', 'Viet Fresh', 'VIETFRESH-2024-001', 'Lê Thị B', 'contact@vietfresh.vn', '+84-28-9876-5432', '456 Lê Văn Lương, TP.HCM'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = '550e8400-e29b-41d4-a716-446655440002'::UUID);

-- ============================================================================
-- SECTION 3: PROFILES
-- ============================================================================

DO $$
BEGIN
    INSERT INTO profiles (id, company_id, full_name, role, phone)
    SELECT 'f47ac10b-58cc-4372-a567-0e02b2c3d471'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Demo Admin', 'admin', '+84900000000'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d471'::UUID);
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'Bỏ qua profile do thiếu User ID.';
END $$;

-- ============================================================================
-- SECTION 4: FACILITIES
-- ============================================================================

INSERT INTO facilities (id, company_id, name, facility_type, address, gps_coordinates, location_code, fda_registration_status)
SELECT '660e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'VNTEETH Main Farm', 'Farm', '123 Nguyễn Hữu Cảnh, TP.HCM', '10.8141, 106.7290', 'VNTEETH-FARM-001', 'registered'
WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE id = '660e8400-e29b-41d4-a716-446655440001'::UUID);

INSERT INTO facilities (id, company_id, name, facility_type, address, gps_coordinates, location_code, fda_registration_status)
SELECT '660e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Viet Fresh Packing Center', 'Packing House', '456 Lê Văn Lương, TP.HCM', '10.7769, 106.6900', 'VIETFRESH-PACK-001', 'registered'
WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE id = '660e8400-e29b-41d4-a716-446655440002'::UUID);

-- ============================================================================
-- SECTION 5: PRODUCTS
-- ============================================================================

INSERT INTO products (id, company_id, product_code, product_name, category, unit_of_measure)
SELECT '440e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'VNTEETH-TOMATO', 'Cherry Tomatoes', 'Vegetables', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'VNTEETH-TOMATO');

INSERT INTO products (id, company_id, product_code, product_name, category, unit_of_measure)
SELECT '440e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'VIETFRESH-MANGO', 'Fresh Mango', 'Fruits', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'VIETFRESH-MANGO');

-- ============================================================================
-- SECTION 6: KDE REQUIREMENTS
-- ============================================================================

-- Đổi fs_reference thành fsma_reference để khớp với schema thực tế của bạn
INSERT INTO kde_requirements (event_type, kde_field, is_required, fsma_reference, error_message)
SELECT 'Harvest', 'gps_coordinates', true, 'FSMA 204 - 11.31', 'GPS coordinates are required for Harvest events.'
WHERE NOT EXISTS (SELECT 1 FROM kde_requirements WHERE event_type = 'Harvest' AND kde_field = 'gps_coordinates');

INSERT INTO kde_requirements (event_type, kde_field, is_required, fsma_reference, error_message)
SELECT 'Harvest', 'location_code', true, 'FSMA 204 - 11.31', 'Location code is required.'
WHERE NOT EXISTS (SELECT 1 FROM kde_requirements WHERE event_type = 'Harvest' AND kde_field = 'location_code');

INSERT INTO kde_requirements (event_type, kde_field, is_required, fsma_reference, error_message)
SELECT 'Receive', 'received_date', true, 'FSMA 204 - 11.32', 'Date of receipt is required.'
WHERE NOT EXISTS (SELECT 1 FROM kde_requirements WHERE event_type = 'Receive' AND kde_field = 'received_date');

INSERT INTO kde_requirements (event_type, kde_field, is_required, fsma_reference, error_message)
SELECT 'Transform', 'transform_ratio', true, 'FSMA 204 - 11.33', 'Transformation ratio must be documented.'
WHERE NOT EXISTS (SELECT 1 FROM kde_requirements WHERE event_type = 'Transform' AND kde_field = 'transform_ratio');

INSERT INTO kde_requirements (event_type, kde_field, is_required, fsma_reference, error_message)
SELECT 'Ship', 'shipment_date', true, 'FSMA 204 - 11.34', 'Shipment date is required.'
WHERE NOT EXISTS (SELECT 1 FROM kde_requirements WHERE event_type = 'Ship' AND kde_field = 'shipment_date');

-- ============================================================================
-- SECTION 7: TRACEABILITY LOTS
-- ============================================================================

INSERT INTO traceability_lots (id, facility_id, product_id, tlc, batch_number, quantity, unit, status, production_date, expiry_date)
SELECT 
    '770e8400-e29b-41d4-a716-446655440001'::UUID, 
    '660e8400-e29b-41d4-a716-446655440001'::UUID, 
    '440e8400-e29b-41d4-a716-446655440001'::UUID, 
    'TLC-TOM-001', 
    'BATCH-A1', 
    500.0, 
    'kg', 
    'available',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days'
WHERE NOT EXISTS (SELECT 1 FROM traceability_lots WHERE id = '770e8400-e29b-41d4-a716-446655440001'::UUID);

-- ============================================================================
-- SECTION 8: CRITICAL TRACKING EVENTS
-- ============================================================================

INSERT INTO critical_tracking_events (id, facility_id, tlc_id, event_type, event_date, description, responsible_person)
SELECT '880e8400-e29b-41d4-a716-446655440001'::UUID, '660e8400-e29b-41d4-a716-446655440001'::UUID, '770e8400-e29b-41d4-a716-446655440001'::UUID, 'Harvest', NOW(), 'Initial harvest from sector 5', 'Trần Văn A'
WHERE NOT EXISTS (SELECT 1 FROM critical_tracking_events WHERE id = '880e8400-e29b-41d4-a716-446655440001'::UUID);

-- Bật lại trigger
SET session_replication_role = 'origin';
