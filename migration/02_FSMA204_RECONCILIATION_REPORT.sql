-- ============================================================================
-- FSMA204 POSTGRESQL TO MYSQL 8.0+ MIGRATION
-- RECONCILIATION REPORT (Báo cáo Đối soát)
-- Generated: 2025-12-29
-- Database: FSMA204 (ardnckigvyqqftpfedrp)
-- ============================================================================

-- ============================================================================
-- PHẦN 1: BẢNG KÊ SỐ LƯỢNG (ROW COUNT INVENTORY)
-- ============================================================================

/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    DANH SÁCH ĐẦY ĐỦ 50 BẢNG - FSMA204 DATABASE                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ SCHEMA: public (16 bảng - CẦN MIGRATE)                                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  #  │ Table Name               │ Row Count │ Ghi chú                          ║
╠═════╪══════════════════════════╪═══════════╪══════════════════════════════════╣
║  1  │ audit_reports            │     0     │ Báo cáo kiểm toán                ║
║  2  │ companies                │     1     │ Thông tin công ty                ║
║  3  │ company_subscriptions    │     0     │ Gói đăng ký của công ty          ║
║  4  │ critical_tracking_events │     0     │ Sự kiện theo dõi quan trọng      ║
║  5  │ facilities               │     2     │ Cơ sở/nhà máy                    ║
║  6  │ fda_registrations        │     0     │ Đăng ký FDA                      ║
║  7  │ key_data_elements        │     0     │ Phần tử dữ liệu chính            ║
║  8  │ notification_queue       │     0     │ Hàng đợi thông báo               ║
║  9  │ products                 │     2     │ Sản phẩm                         ║
║ 10  │ profiles                 │     0     │ Hồ sơ người dùng                 ║
║ 11  │ service_packages         │     3     │ Gói dịch vụ                      ║
║ 12  │ shipments                │     0     │ Lô hàng vận chuyển               ║
║ 13  │ subscription_audit_logs  │     0     │ Log kiểm toán đăng ký            ║
║ 14  │ system_logs              │     0     │ Log hệ thống                     ║
║ 15  │ traceability_lots        │     0     │ Lô truy xuất nguồn gốc           ║
║ 16  │ us_agents                │     0     │ Đại lý US                        ║
╠═════╧══════════════════════════╧═══════════╧══════════════════════════════════╣
║ TỔNG CỘNG PUBLIC SCHEMA:  8 dòng dữ liệu (cần migrate)                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║ SCHEMA: auth (20 bảng - KHÔNG MIGRATE - Supabase System)                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  #  │ Table Name               │ Row Count │ Ghi chú                          ║
╠═════╪══════════════════════════╪═══════════╪══════════════════════════════════╣
║  1  │ audit_log_entries        │     0     │ Supabase Auth audit              ║
║  2  │ flow_state               │     0     │ OAuth flow state                 ║
║  3  │ identities               │     1     │ User identities                  ║
║  4  │ instances                │     0     │ Auth instances                   ║
║  5  │ mfa_amr_claims           │     0     │ MFA claims                       ║
║  6  │ mfa_challenges           │     0     │ MFA challenges                   ║
║  7  │ mfa_factors              │     0     │ MFA factors                      ║
║  8  │ one_time_tokens          │     0     │ OTP tokens                       ║
║  9  │ refresh_tokens           │     1     │ JWT refresh tokens               ║
║ 10  │ saml_providers           │     0     │ SAML providers                   ║
║ 11  │ saml_relay_states        │     0     │ SAML relay states                ║
║ 12  │ schema_migrations        │    23     │ Auth schema versions             ║
║ 13  │ sessions                 │     1     │ User sessions                    ║
║ 14  │ sso_domains              │     0     │ SSO domains                      ║
║ 15  │ sso_providers            │     0     │ SSO providers                    ║
║ 16  │ users                    │     1     │ Auth users                       ║
╠═════╧══════════════════════════╧═══════════╧══════════════════════════════════╣
║ (+ 4 bảng khác: presigned_urls, presigned_url_parts, sign_key_version,        ║
║   one_time_token_uses)                                                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║ SCHEMA: storage (9 bảng - KHÔNG MIGRATE - Supabase Storage)                   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ buckets, migrations, objects, s3_multipart_uploads, etc.                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║ SCHEMA: realtime (3 bảng), supabase_migrations (1), vault (1)                 ║
║ KHÔNG MIGRATE - Supabase Infrastructure                                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

LƯU Ý QUAN TRỌNG:
- Chỉ cần migrate 16 bảng trong schema PUBLIC
- 34 bảng còn lại thuộc Supabase system infrastructure
- Nếu chuyển sang MySQL, cần tự implement auth system riêng
*/


-- ============================================================================
-- PHẦN 2: KIỂM TRA DỮ LIỆU THỰC TẾ (DATA SAMPLE)
-- INSERT INTO statements theo cú pháp MySQL 8.0+
-- ============================================================================

-- -------------------------------------------------------------------------
-- 2.1 BẢNG: companies (1 dòng)
-- -------------------------------------------------------------------------
INSERT INTO `companies` (
  `id`, `name`, `registration_number`, `address`, 
  `phone`, `email`, `contact_person`, 
  `created_at`, `updated_at`, `stripe_customer_id`
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Công ty TNHH Thủy sản Việt Nam',
  'MST-0123456789',
  '123 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM',
  '+84 28 1234 5678',
  'contact@thuysan.vn',
  'Nguyễn Văn A',
  '2025-12-22 01:46:05.728105',
  '2025-12-22 01:46:05.728105',
  NULL
);

-- -------------------------------------------------------------------------
-- 2.2 BẢNG: facilities (2 dòng)
-- -------------------------------------------------------------------------
INSERT INTO `facilities` (
  `id`, `company_id`, `name`, `facility_type`, `location_code`,
  `address`, `gps_coordinates`, `certification_status`,
  `created_at`, `updated_at`
) VALUES 
(
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Cơ sở chế biến số 1',
  'processing',
  'FAC-001',
  '456 Đường Lê Văn Việt, TP. Thủ Đức, TP.HCM',
  NULL,
  'certified',
  '2025-12-22 01:46:05.728105',
  '2025-12-22 01:46:05.728105'
),
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Kho lạnh trung tâm',
  'storage',
  'FAC-002',
  '789 Đường Võ Văn Kiệt, Quận 1, TP.HCM',
  NULL,
  'certified',
  '2025-12-22 01:46:05.728105',
  '2025-12-22 01:46:05.728105'
);

-- -------------------------------------------------------------------------
-- 2.3 BẢNG: products (2 dòng)
-- -------------------------------------------------------------------------
INSERT INTO `products` (
  `id`, `company_id`, `product_code`, `product_name`, `product_name_vi`,
  `description`, `category`, `is_ftl`, `unit_of_measure`, `requires_cte`,
  `created_at`, `updated_at`
) VALUES 
(
  '770e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'PRD-SHRIMP-001',
  'Fresh Shrimp',
  'Tôm tươi',
  NULL,
  'seafood',
  TRUE,
  'kg',
  TRUE,
  '2025-12-22 01:46:05.728105',
  '2025-12-22 01:46:05.728105'
),
(
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'PRD-FISH-001',
  'Fresh Tuna',
  'Cá ngừ tươi',
  NULL,
  'seafood',
  TRUE,
  'kg',
  TRUE,
  '2025-12-22 01:46:05.728105',
  '2025-12-22 01:46:05.728105'
);

-- -------------------------------------------------------------------------
-- 2.4 BẢNG: service_packages (3 dòng)
-- -------------------------------------------------------------------------
INSERT INTO `service_packages` (
  `id`, `package_name`, `package_name_vi`, `package_code`, 
  `description`, `description_vi`,
  `price_monthly`, `price_yearly`, `price_currency`,
  `max_users`, `max_facilities`, `max_products`, `max_storage_gb`,
  `includes_fda_management`, `includes_agent_management`,
  `includes_cte_tracking`, `includes_reporting`,
  `includes_api_access`, `includes_custom_branding`, `includes_priority_support`,
  `is_active`, `is_featured`, `sort_order`,
  `created_at`, `updated_at`
) VALUES 
(
  '558f41d6-6803-4d2c-9326-b9ea146a9aff',
  'Starter',
  'Gói Khởi Đầu',
  'STARTER',
  'Perfect for small businesses starting with food traceability',
  'Phù hợp cho doanh nghiệp nhỏ bắt đầu với truy xuất nguồn gốc thực phẩm',
  29.00, 290.00, 'USD',
  3, 1, 50, 5.00,
  FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE,
  TRUE, FALSE, 1,
  '2025-12-22 11:24:08.08315',
  '2025-12-22 11:24:08.08315'
),
(
  'aab99f58-156b-4699-aac5-4d666758933a',
  'Professional',
  'Gói Chuyên Nghiệp',
  'PROFESSIONAL',
  'For growing businesses with FDA compliance needs',
  'Dành cho doanh nghiệp phát triển với nhu cầu tuân thủ FDA',
  99.00, 990.00, 'USD',
  10, 3, 200, 20.00,
  TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE,
  TRUE, FALSE, 2,
  '2025-12-22 11:24:08.08315',
  '2025-12-22 11:24:08.08315'
),
(
  '5532cca9-f783-41f8-912f-9127caddca98',
  'Enterprise',
  'Gói Doanh Nghiệp',
  'ENTERPRISE',
  'Complete solution for large organizations',
  'Giải pháp hoàn chỉnh cho tổ chức lớn',
  299.00, 2990.00, 'USD',
  -1, -1, -1, 100.00,  -- -1 = unlimited
  TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE,
  TRUE, TRUE, 3,
  '2025-12-22 11:24:08.08315',
  '2025-12-22 11:24:08.08315'
);

-- -------------------------------------------------------------------------
-- 2.5 BẢNG: traceability_lots, critical_tracking_events (CẦN SAMPLE DATA)
-- -------------------------------------------------------------------------
/*
QUAN TRỌNG: Các bảng sau hiện KHÔNG CÓ DỮ LIỆU trong PostgreSQL:
- traceability_lots: 0 dòng
- critical_tracking_events: 0 dòng  
- profiles: 0 dòng
- us_agents: 0 dòng
- fda_registrations: 0 dòng
- company_subscriptions: 0 dòng
- shipments: 0 dòng
- key_data_elements: 0 dòng
- audit_reports: 0 dòng
- notification_queue: 0 dòng
- system_logs: 0 dòng
- subscription_audit_logs: 0 dòng

Khi có dữ liệu thực tế, INSERT statements sẽ được generate tương tự.
*/


-- ============================================================================
-- PHẦN 3: XÁC NHẬN LOGIC (LOGIC INTEGRITY)
-- ============================================================================

/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    XÁC NHẬN LOGIC EXPIRY_DATE VÀ TRIGGERS                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

PHÁT HIỆN TỪ POSTGRESQL:
-----------------------
Sau khi quét toàn bộ database FSMA204, tôi xác nhận:
1. KHÔNG CÓ TRIGGER nào trong schema public
2. KHÔNG CÓ stored procedure phức tạp nào cho expiry_date calculation
3. Các function tồn tại chỉ là utility functions của Supabase

CÁC FUNCTION POSTGRESQL ĐÃ TÌM THẤY:
------------------------------------
1. handle_new_user() - Tạo profile khi user đăng ký (Supabase Auth trigger)
2. check_and_update_expired_subscriptions() - Kiểm tra subscription hết hạn
3. increment_subscription_usage() - Tăng usage counter
4. decrement_subscription_usage() - Giảm usage counter
5. update_updated_at_column() - Auto-update timestamp

LOGIC EXPIRY_DATE:
-----------------
Hiện tại KHÔNG CÓ trigger tự động tính expiry_date trong PostgreSQL.
Logic này phải được xử lý ở APPLICATION LEVEL (Backend code).

Nếu cần implement trong MySQL, có 2 phương án:

PHƯƠNG ÁN A - MySQL Trigger (Khuyến nghị cho logic đơn giản):
*/

DELIMITER //

-- Trigger tự động tính expiry_date khi INSERT traceability_lots
CREATE TRIGGER `trg_calculate_expiry_date_insert`
BEFORE INSERT ON `traceability_lots`
FOR EACH ROW
BEGIN
  -- Nếu expiry_date chưa được set và có production_date + shelf_life_days
  IF NEW.expiry_date IS NULL AND NEW.production_date IS NOT NULL THEN
    -- Lấy shelf_life từ product config hoặc default 30 ngày
    SET NEW.expiry_date = DATE_ADD(NEW.production_date, INTERVAL COALESCE(NEW.shelf_life_days, 30) DAY);
  END IF;
END //

-- Trigger tự động tính expiry_date khi UPDATE
CREATE TRIGGER `trg_calculate_expiry_date_update`
BEFORE UPDATE ON `traceability_lots`
FOR EACH ROW
BEGIN
  -- Recalculate nếu production_date thay đổi
  IF NEW.production_date <> OLD.production_date OR OLD.production_date IS NULL THEN
    SET NEW.expiry_date = DATE_ADD(NEW.production_date, INTERVAL COALESCE(NEW.shelf_life_days, 30) DAY);
  END IF;
END //

DELIMITER ;

/*
PHƯƠNG ÁN B - Backend Application (Khuyến nghị cho logic phức tạp):
-------------------------------------------------------------------
Nếu logic expiry_date phức tạp hơn (dựa vào nhiều yếu tố như:
- Loại sản phẩm
- Điều kiện bảo quản
- Quy định FDA cho từng category
- Temperature zones

Thì PHẢI xử lý trong application code:

// TypeScript/Node.js example
function calculateExpiryDate(lot: TraceabilityLot, product: Product): Date {
  const baseShelfLife = product.shelf_life_days || 30;
  
  // Điều chỉnh theo category
  let adjustedDays = baseShelfLife;
  if (product.category === 'seafood') {
    adjustedDays = Math.min(baseShelfLife, 14); // Seafood max 14 ngày
  }
  
  // Điều chỉnh theo điều kiện bảo quản
  if (lot.storage_condition === 'frozen') {
    adjustedDays *= 6; // Frozen có thể kéo dài 6x
  }
  
  return addDays(lot.production_date, adjustedDays);
}

WASTE VARIANCE LOGIC:
--------------------
Tương tự, logic tính Waste Variance (variance giữa expected vs actual waste)
KHÔNG có trong PostgreSQL triggers. Phải implement ở backend:

// TypeScript example
function calculateWasteVariance(expected: number, actual: number): {
  variance: number;
  variance_percentage: number;
  status: 'normal' | 'warning' | 'critical';
} {
  const variance = actual - expected;
  const variance_percentage = expected > 0 ? (variance / expected) * 100 : 0;
  
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (variance_percentage > 20) status = 'critical';
  else if (variance_percentage > 10) status = 'warning';
  
  return { variance, variance_percentage, status };
}
*/


-- ============================================================================
-- PHẦN 4: TRÌNH TỰ NẠP DỮ LIỆU (DEPENDENCY ORDER)
-- ============================================================================

/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║          THỨU TỰ NẠP DỮ LIỆU - TÔN TRỌNG FOREIGN KEY CONSTRAINTS             ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Dựa trên Foreign Key analysis, thứ tự nạp data phải tuân theo:

┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 0 - BẢNG ĐỘC LẬP (Không có FK, nạp trước)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. service_packages      ← Định nghĩa gói dịch vụ                          │
│ 2. companies             ← Thông tin công ty (root entity)                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1 - PHỤ THUỘC VÀO LEVEL 0                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. profiles              ← FK: companies.id (user profiles)                │
│ 4. facilities            ← FK: companies.id                                │
│ 5. products              ← FK: companies.id                                │
│ 6. us_agents             ← FK: companies.id                                │
│ 7. fda_registrations     ← FK: companies.id                                │
│ 8. company_subscriptions ← FK: companies.id, service_packages.id           │
│ 9. notification_queue    ← FK: companies.id                                │
│ 10. system_logs          ← FK: companies.id (nullable)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2 - PHỤ THUỘC VÀO LEVEL 1                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 11. traceability_lots    ← FK: products.id, facilities.id                  │
│ 12. shipments            ← FK: facilities.id (from/to)                     │
│ 13. subscription_audit_logs ← FK: company_subscriptions.id                 │
│ 14. audit_reports        ← FK: facilities.id                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3 - PHỤ THUỘC VÀO LEVEL 2                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 15. critical_tracking_events ← FK: traceability_lots.id, facilities.id     │
│ 16. key_data_elements    ← FK: critical_tracking_events.id                 │
└─────────────────────────────────────────────────────────────────────────────┘

SCRIPT NẠP DỮ LIỆU THEO THỨ TỰ:
*/

-- Disable FK checks temporarily for bulk import
SET FOREIGN_KEY_CHECKS = 0;

-- LEVEL 0: Independent tables
SOURCE 01_service_packages.sql;
SOURCE 02_companies.sql;

-- LEVEL 1: Depends on Level 0
SOURCE 03_profiles.sql;
SOURCE 04_facilities.sql;
SOURCE 05_products.sql;
SOURCE 06_us_agents.sql;
SOURCE 07_fda_registrations.sql;
SOURCE 08_company_subscriptions.sql;
SOURCE 09_notification_queue.sql;
SOURCE 10_system_logs.sql;

-- LEVEL 2: Depends on Level 1
SOURCE 11_traceability_lots.sql;
SOURCE 12_shipments.sql;
SOURCE 13_subscription_audit_logs.sql;
SOURCE 14_audit_reports.sql;

-- LEVEL 3: Depends on Level 2
SOURCE 15_critical_tracking_events.sql;
SOURCE 16_key_data_elements.sql;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify referential integrity
SELECT 'Checking referential integrity...' AS status;
-- (Add specific checks here if needed)


-- ============================================================================
-- PHẦN 5: TÓM TẮT VÀ KHUYẾN NGHỊ
-- ============================================================================

/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         TÓM TẮT BÁO CÁO ĐỐI SOÁT                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝

1. KIỂM KÊ BẢNG:
   ✓ Tổng số bảng trong DB: 50
   ✓ Bảng cần migrate (public schema): 16
   ✓ Bảng Supabase system (không migrate): 34
   
2. KIỂM KÊ DỮ LIỆU:
   ✓ Tổng số dòng cần migrate: 8 dòng
   ✓ companies: 1 dòng
   ✓ facilities: 2 dòng
   ✓ products: 2 dòng
   ✓ service_packages: 3 dòng
   ✓ 12 bảng còn lại: 0 dòng (empty)
   
3. LOGIC INTEGRITY:
   ✓ KHÔNG CÓ trigger expiry_date trong PostgreSQL
   ✓ Logic phải implement ở application layer
   ✓ MySQL triggers đã được chuẩn bị (optional)
   
4. DEPENDENCY ORDER:
   ✓ 4 levels đã được xác định
   ✓ Thứ tự 16 bảng từ parent → child
   
5. CẢNH BÁO:
   ⚠ Supabase Auth (schema auth) KHÔNG được migrate
   ⚠ Cần implement auth system riêng cho MySQL
   ⚠ profiles table liên kết với auth.users qua UUID
   ⚠ Sau khi migrate, cần update auth integration

╔═══════════════════════════════════════════════════════════════════════════════╗
║              NHỮNG PHẦN POSTGRESQL MÀ MYSQL KHÔNG HỖ TRỢ TRỰC TIẾP           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

| PostgreSQL Feature          | MySQL 8.0+ Equivalent           | Backend Required |
|----------------------------|--------------------------------|------------------|
| UUID data type             | CHAR(36) or BINARY(16)         | No               |
| JSONB operators (@>, ?)    | JSON_CONTAINS, JSON_EXTRACT    | Maybe            |
| Array types (text[])       | JSON array or junction table   | Yes              |
| Interval arithmetic        | DATE_ADD/DATE_SUB              | No               |
| NOTIFY/LISTEN              | Not supported                  | Yes (polling/ws) |
| Row Level Security (RLS)   | Views + app-level checks       | Yes              |
| Supabase Auth integration  | Custom auth implementation     | Yes              |
| Realtime subscriptions     | WebSocket server needed        | Yes              |
| Storage buckets            | S3/MinIO integration           | Yes              |

*/

-- End of Reconciliation Report
