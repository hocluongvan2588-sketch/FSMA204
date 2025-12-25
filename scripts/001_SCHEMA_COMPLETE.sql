-- ============================================================================
-- FoodTrace FSMA 204 Traceability System - FULL COMPREHENSIVE SCHEMA
-- ============================================================================
-- File này chứa toàn bộ cấu trúc bảng, hàm, trigger và dữ liệu mẫu.
-- Đã cập nhật: Sửa lỗi thiếu 'address' trong bảng facilities và seed data.
-- ============================================================================

-- 0. Dọn dẹp với CASCADE để xóa các đối tượng phụ thuộc (Trigger)
DROP FUNCTION IF EXISTS calculate_realtime_compliance_score(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_harvest_kdes() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 1. Tiện ích mở rộng
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: DỊCH VỤ & ĐĂNG KÝ
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_code TEXT UNIQUE NOT NULL,
    package_name TEXT NOT NULL,
    package_name_vi TEXT NOT NULL,
    max_facilities INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL, -- Đảm bảo khớp với yêu cầu DB
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    package_id UUID REFERENCES service_packages(id),
    subscription_status TEXT CHECK (subscription_status IN ('active', 'expired', 'trial')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: CƠ SỞ & SẢN PHẨM (FSMA 204 CORE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL, -- ĐÃ FIX: Thêm ràng buộc NOT NULL đồng bộ với lỗi bạn gặp
    facility_type TEXT CHECK (facility_type IN ('Farm', 'Packing House', 'Processor', 'Distributor', 'Importer')),
    gps_coordinates TEXT, 
    location_code TEXT,    
    fda_registration_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    is_ftl BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, product_code)
);

CREATE TABLE IF NOT EXISTS traceability_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tlc TEXT NOT NULL, 
    quantity NUMERIC(15,4),
    unit TEXT,
    production_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(facility_id, tlc)
);

-- ============================================================================
-- SECTION 3: SỰ KIỆN TRUY XUẤT (CTE & KDE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS critical_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    tlc_id UUID REFERENCES traceability_lots(id),
    event_type TEXT CHECK (event_type IN ('Harvest', 'Receive', 'Transform', 'Ship', 'Cooling')),
    event_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS key_data_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cte_id UUID REFERENCES critical_tracking_events(id) ON DELETE CASCADE,
    kde_type TEXT NOT NULL, 
    key_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: HÀM VÀ TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_realtime_compliance_score(company_id_param UUID)
RETURNS TABLE (
    compliance_score NUMERIC,
    compliance_status TEXT,
    total_ctes BIGINT,
    compliant_ctes BIGINT,
    non_compliant_ctes BIGINT,
    missing_kdes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH cte_counts AS (
        SELECT 
            COUNT(DISTINCT c.id) as total,
            COUNT(DISTINCT CASE 
                WHEN (
                    SELECT COUNT(*) FROM key_data_elements 
                    WHERE cte_id = c.id 
                    AND kde_type IN ('gps_coordinates', 'location_code')
                ) >= 2 THEN c.id 
            END) as compliant,
            COUNT(DISTINCT CASE 
                WHEN (
                    SELECT COUNT(*) FROM key_data_elements 
                    WHERE cte_id = c.id 
                    AND kde_type IN ('gps_coordinates', 'location_code')
                ) < 2 THEN c.id 
            END) as missing
        FROM critical_tracking_events c
        JOIN facilities f ON c.facility_id = f.id
        WHERE f.company_id = company_id_param
    )
    SELECT 
        -- Logic mới: 0 CTE = "Incomplete" (null score), có CTE = % compliance
        CASE 
            WHEN total = 0 THEN NULL
            ELSE ROUND((compliant::NUMERIC / total) * 100, 2)
        END,
        -- Status field mới để phân biệt Incomplete vs Non-compliant
        CASE 
            WHEN total = 0 THEN 'incomplete'::TEXT
            WHEN compliant::NUMERIC / total >= 0.9 THEN 'compliant'::TEXT
            ELSE 'non_compliant'::TEXT
        END,
        total,
        compliant,
        total - compliant,
        missing
    FROM cte_counts;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION validate_harvest_kdes()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng các Trigger
DROP TRIGGER IF EXISTS trg_update_facilities ON facilities;
CREATE TRIGGER trg_update_facilities 
    BEFORE UPDATE ON facilities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS validate_harvest_kdes_trigger ON critical_tracking_events;
CREATE TRIGGER validate_harvest_kdes_trigger 
    BEFORE INSERT ON critical_tracking_events 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_harvest_kdes();

-- ============================================================================
-- SECTION 5: SEED DATA (ĐÃ FIX THIẾU CỘT ADDRESS)
-- ============================================================================

-- 5.1 Gói dịch vụ
INSERT INTO service_packages (package_code, package_name, package_name_vi, max_facilities)
VALUES 
    ('PREMIUM', 'Premium Package', 'Gói Cao Cấp', 10),
    ('BASIC', 'Basic Package', 'Gói Cơ Bản', 1)
ON CONFLICT (package_code) DO UPDATE SET 
    package_name_vi = EXCLUDED.package_name_vi;

-- 5.2 Chỉ 2 công ty mẫu
INSERT INTO companies (registration_number, name, address, email)
VALUES 
    ('VNTEETH-001', 'VNTEETH Dental Supply', 'Quận 1, TP. Hồ Chí Minh', 'contact@vnteeth.vn'),
    ('FARM-EX-099', 'Organic Farm Group', 'Huyện Lạc Dương, Lâm Đồng', 'hello@organicfarm.vn')
ON CONFLICT (registration_number) DO UPDATE SET 
    address = EXCLUDED.address;

-- 5.3 Chèn cơ sở mẫu (Đã thêm trường address để tránh lỗi NOT NULL)
DO $$
DECLARE
    v_comp1_id UUID;
    v_comp2_id UUID;
BEGIN
    SELECT id INTO v_comp1_id FROM companies WHERE registration_number = 'VNTEETH-001';
    SELECT id INTO v_comp2_id FROM companies WHERE registration_number = 'FARM-EX-099';

    IF v_comp1_id IS NOT NULL THEN
        INSERT INTO facilities (company_id, name, address, facility_type, location_code)
        VALUES (v_comp1_id, 'Kho Trung Tâm VNTEETH', '7/2 Lê Thánh Tôn, Quận 1, HCM', 'Distributor', 'LOC-HCM-VNT-01')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_comp2_id IS NOT NULL THEN
        INSERT INTO facilities (company_id, name, address, facility_type, gps_coordinates, location_code)
        VALUES (v_comp2_id, 'Trang Trại Hữu Cơ Đà Lạt', 'Thôn 1, Xã Đạ Sar, Lạc Dương', 'Farm', '11.94, 108.44', 'LOC-DL-ORG-99')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
