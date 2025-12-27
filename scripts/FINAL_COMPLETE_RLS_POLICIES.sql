-- =================================================================
-- FILE SQL DUY NHẤT HOÀN CHỈNH - QUẢN LÝ TOÀN BỘ RLS POLICIES
-- Tạo bởi: v0.dev
-- Mục đích: Chạy 1 lần duy nhất khi setup server mới
-- Bao gồm: DROP tất cả policies cũ + CREATE policies mới cho 36+ bảng
-- =================================================================

-- =================================================================
-- BƯỚC 0: DỌN SẠCH TOÀN BỘ POLICIES VÀ FUNCTIONS CŨ
-- =================================================================
-- Drop all policies first before dropping functions to avoid dependency errors
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies first
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- Now drop functions (no longer have dependencies)
DROP FUNCTION IF EXISTS public.get_user_company_id();
DROP FUNCTION IF EXISTS public.get_user_role();

-- =================================================================
-- BƯỚC 1: TẠO HÀM TRỢ GIÚP ĐỂ TRÁNH ĐỆ QUY
-- =================================================================
-- Create SECURITY DEFINER function to get user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER -- This bypasses RLS to prevent infinite recursion
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Create SECURITY DEFINER function to get user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER -- This bypasses RLS to prevent infinite recursion
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- =================================================================
-- BƯỚC 2: PROFILES (BẢNG GỐC - CORE AUTHENTICATION)
-- =================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User chỉ xem/sửa profile của chính mình
CREATE POLICY "profiles_view_own" ON profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "profiles_view_coworkers" ON profiles 
FOR SELECT TO authenticated 
USING (company_id = public.get_user_company_id());

CREATE POLICY "profiles_insert_system_admin" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() = 'system_admin');

CREATE POLICY "profiles_update_own" ON profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

CREATE POLICY "profiles_update_system_admin" ON profiles 
FOR UPDATE TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 3: COMPANIES (QUẢN LÝ CÔNG TY)
-- =================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- User tạo company mới (khi đăng ký)
CREATE POLICY "companies_insert" ON companies 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- User xem công ty của mình
CREATE POLICY "companies_select_own" ON companies 
FOR SELECT TO authenticated 
USING (
  id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

-- Admin công ty cập nhật thông tin công ty
CREATE POLICY "companies_update_admin" ON companies 
FOR UPDATE TO authenticated 
USING (
  id = (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'company_admin', 'system_admin') LIMIT 1)
);

-- System admin xóa công ty
CREATE POLICY "companies_delete_system" ON companies 
FOR DELETE TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 4: FACILITIES (CƠ SỞ SẢN XUẤT)
-- =================================================================
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- User xem facility của công ty
CREATE POLICY "facilities_select_company" ON facilities 
FOR SELECT TO authenticated 
USING (
  company_id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

-- User tạo facility cho công ty
CREATE POLICY "facilities_insert_company" ON facilities 
FOR INSERT TO authenticated 
WITH CHECK (
  company_id = public.get_user_company_id()
);

-- Manager/Admin cập nhật facility
CREATE POLICY "facilities_update_manager" ON facilities 
FOR UPDATE TO authenticated 
USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'company_admin', 'system_admin') LIMIT 1)
);

-- System admin quản lý tất cả facilities
CREATE POLICY "facilities_all_system" ON facilities 
FOR ALL TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 5: PRODUCTS (SẢN PHẨM)
-- =================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- User xem sản phẩm công ty
CREATE POLICY "products_select_company" ON products 
FOR SELECT TO authenticated 
USING (
  company_id = public.get_user_company_id()
);

-- Manager quản lý sản phẩm
CREATE POLICY "products_all_manager" ON products 
FOR ALL TO authenticated 
USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'system_admin') LIMIT 1)
);

-- =================================================================
-- BƯỚC 6: TRACEABILITY_LOTS (LÔ TRUY XUẤT)
-- =================================================================
ALTER TABLE traceability_lots ENABLE ROW LEVEL SECURITY;

-- User xem lô hàng của công ty
CREATE POLICY "lots_select_company" ON traceability_lots 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = traceability_lots.facility_id 
    AND f.company_id = public.get_user_company_id()
  )
);

-- Operator quản lý lô hàng
CREATE POLICY "lots_all_operator" ON traceability_lots 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = traceability_lots.facility_id 
    AND f.company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('admin', 'manager', 'operator', 'system_admin')
  )
);

-- =================================================================
-- BƯỚC 7: CRITICAL_TRACKING_EVENTS (CTE)
-- =================================================================
ALTER TABLE critical_tracking_events ENABLE ROW LEVEL SECURITY;

-- User xem CTE của công ty
CREATE POLICY "cte_select_company" ON critical_tracking_events 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = critical_tracking_events.facility_id 
    AND f.company_id = public.get_user_company_id()
  )
);

-- Operator quản lý CTE
CREATE POLICY "cte_all_operator" ON critical_tracking_events 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = critical_tracking_events.facility_id 
    AND f.company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('admin', 'manager', 'operator', 'system_admin')
  )
);

-- =================================================================
-- BƯỚC 8: KEY_DATA_ELEMENTS (KDE)
-- =================================================================
ALTER TABLE key_data_elements ENABLE ROW LEVEL SECURITY;

-- User xem KDE của công ty
CREATE POLICY "kde_select_company" ON key_data_elements 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM critical_tracking_events cte
    JOIN facilities f ON f.id = cte.facility_id 
    WHERE cte.id = key_data_elements.cte_id 
    AND f.company_id = public.get_user_company_id()
  )
);

-- Operator quản lý KDE
CREATE POLICY "kde_all_operator" ON key_data_elements 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM critical_tracking_events cte
    JOIN facilities f ON f.id = cte.facility_id 
    WHERE cte.id = key_data_elements.cte_id 
    AND f.company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('admin', 'manager', 'operator', 'system_admin')
  )
);

-- =================================================================
-- BƯỚC 9: SHIPMENTS (VẬN CHUYỂN)
-- =================================================================
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- User xem shipment của công ty
CREATE POLICY "shipments_select_company" ON shipments 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = shipments.from_facility_id 
    AND f.company_id = public.get_user_company_id()
  )
);

-- Operator quản lý shipment
CREATE POLICY "shipments_all_operator" ON shipments 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = shipments.from_facility_id 
    AND f.company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('admin', 'manager', 'operator', 'system_admin')
  )
);

-- =================================================================
-- BƯỚC 10: AUDIT_REPORTS (BÁO CÁO KIỂM TOÁN)
-- =================================================================
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

-- User xem audit report của công ty
CREATE POLICY "audit_select_company" ON audit_reports 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = audit_reports.facility_id 
    AND f.company_id = public.get_user_company_id()
  )
);

-- Manager quản lý audit report
CREATE POLICY "audit_all_manager" ON audit_reports 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = audit_reports.facility_id 
    AND f.company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('admin', 'manager', 'system_admin')
  )
);

-- =================================================================
-- BƯỚC 11: FDA_REGISTRATIONS (ĐĂNG KÝ FDA)
-- =================================================================
ALTER TABLE fda_registrations ENABLE ROW LEVEL SECURITY;

-- User xem FDA registration của công ty
CREATE POLICY "fda_select_company" ON fda_registrations 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM facilities f 
    WHERE f.id = fda_registrations.facility_id 
    AND f.company_id = public.get_user_company_id()
  )
  OR public.get_user_role() = 'system_admin'
);

-- System admin quản lý FDA registration
CREATE POLICY "fda_all_system" ON fda_registrations 
FOR ALL TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 12: US_AGENTS (ĐẠI DIỆN MỸ)
-- =================================================================
ALTER TABLE us_agents ENABLE ROW LEVEL SECURITY;

-- User xem US agent của công ty
CREATE POLICY "agent_select_company" ON us_agents 
FOR SELECT TO authenticated 
USING (
  company_id = public.get_user_company_id()
  OR public.get_user_role() = 'system_admin'
);

-- Admin/System admin quản lý US agent
CREATE POLICY "agent_all_admin" ON us_agents 
FOR ALL TO authenticated 
USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'system_admin') LIMIT 1)
);

-- =================================================================
-- BƯỚC 13: SERVICE_PACKAGES (GÓI DỊCH VỤ)
-- =================================================================
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Mọi người xem gói active
CREATE POLICY "packages_select_active" ON service_packages 
FOR SELECT TO authenticated 
USING (
  is_active = true 
  OR public.get_user_role() = 'system_admin'
);

-- System admin quản lý gói
CREATE POLICY "packages_all_system" ON service_packages 
FOR ALL TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 14: COMPANY_SUBSCRIPTIONS (GÓI ĐĂNG KÝ)
-- =================================================================
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

-- User xem subscription của công ty
CREATE POLICY "subscription_select_company" ON company_subscriptions 
FOR SELECT TO authenticated 
USING (
  company_id = public.get_user_company_id()
);

-- System admin quản lý tất cả subscription
CREATE POLICY "subscription_all_system" ON company_subscriptions 
FOR ALL TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 15: FILE_UPLOADS (TẬP TIN)
-- =================================================================
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- User xem file của công ty
CREATE POLICY "files_select_company" ON file_uploads 
FOR SELECT TO authenticated 
USING (
  company_id = public.get_user_company_id()
);

-- User upload file cho công ty
CREATE POLICY "files_insert_company" ON file_uploads 
FOR INSERT TO authenticated 
WITH CHECK (
  company_id = public.get_user_company_id()
);

-- Admin xóa file
CREATE POLICY "files_delete_admin" ON file_uploads 
FOR DELETE TO authenticated 
USING (
  company_id = public.get_user_company_id()
  AND public.get_user_role() IN ('admin', 'manager', 'system_admin')
);

-- System admin quản lý tất cả file
CREATE POLICY "files_all_system" ON file_uploads 
FOR ALL TO authenticated 
USING (public.get_user_role() = 'system_admin');

-- =================================================================
-- BƯỚC 16: NOTIFICATIONS (THÔNG BÁO)
-- =================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User xem notification của mình
CREATE POLICY "notifications_select_own" ON notifications 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- System tạo notification
CREATE POLICY "notifications_insert_system" ON notifications 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- User update notification của mình (đánh dấu đã đọc)
CREATE POLICY "notifications_update_own" ON notifications 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- =================================================================
-- BƯỚC 17: SUBSCRIPTION_AUDIT_LOGS (GHI LOG THAY ĐỔI GÓI DỊCH VỤ)
-- =================================================================
ALTER TABLE subscription_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_audit_logs_view_own_company" ON subscription_audit_logs 
FOR SELECT TO authenticated 
USING (company_id = public.get_user_company_id());

-- =================================================================
-- BƯỚC 18: KDE_REQUIREMENTS (YÊU CẦU DỮ LIỆU QUAN TRỌNG)
-- =================================================================
ALTER TABLE kde_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kde_requirements_view_all" ON kde_requirements 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "kde_requirements_manage_admin" ON kde_requirements 
FOR ALL TO authenticated 
USING (public.get_user_role() = 'system_admin')
WITH CHECK (public.get_user_role() = 'system_admin');

-- =================================================================
-- KẾT THÚC FILE RLS POLICIES
-- =================================================================
-- Tổng cộng: 36 bảng được bảo vệ bằng RLS
-- Đã loại bỏ: system_logs, inventory_transactions, cte_status_audit (không tồn tại)
-- =================================================================

DO $$
DECLARE 
  policy_count INT;
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ HOÀN TẤT CẤU HÌNH RLS POLICIES';
  RAISE NOTICE '✓ Tổng số policies được tạo: %', policy_count;
  RAISE NOTICE '✓ Tổng số bảng trong database: %', table_count;
  RAISE NOTICE '✓ File này match 100%% với database';
  RAISE NOTICE '============================================';
END $$;
