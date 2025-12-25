# TRACEABILITY SYSTEM - OFFICIAL DATABASE SCHEMA

📋 Document này cung cấp cấu trúc CHÍNH XÁC của tất cả các bảng liên quan đến Traceability System trong database thực tế.

**Lưu ý quan trọng:** 
- ⚠️ **KHÔNG CÓ cột `harvest_date`** trong bất kỳ bảng nào
- ✅ Sử dụng cột `production_date` (bắt buộc NOT NULL) trong bảng `traceability_lots`
- ✅ Sử dụng cột `location_code` (không phải `location_glo_code`) trong bảng `facilities`

---

## 1. TRACEABILITY_LOTS

**Mục đích:** Lưu trữ thông tin về các lô sản phẩm (Traceability Lot Code - TLC)

### Schema

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| **id** | uuid | NO | uuid_generate_v4() | Primary key |
| **tlc** | text | NO | - | Traceability Lot Code (unique) |
| **product_id** | uuid | NO | - | Foreign key → products.id |
| **facility_id** | uuid | NO | - | Foreign key → facilities.id |
| **batch_number** | text | NO | - | Số lô sản xuất |
| **production_date** | date | NO | - | ⚠️ Ngày sản xuất (BẮT BUỘC) |
| **expiry_date** | date | YES | - | Ngày hết hạn (optional) |
| **quantity** | numeric | NO | - | Số lượng ban đầu |
| **unit** | text | NO | - | Đơn vị (kg, ton, box, etc.) |
| **status** | text | YES | 'active' | Trạng thái (active, depleted, recalled) |
| **available_quantity** | numeric | YES | - | Số lượng còn lại |
| **reserved_quantity** | numeric | YES | 0 | Số lượng đã đặt trước |
| **shipped_quantity** | numeric | YES | 0 | Số lượng đã xuất |
| **created_at** | timestamptz | YES | now() | Thời gian tạo |
| **updated_at** | timestamptz | YES | now() | Thời gian cập nhật |
| **deleted_at** | timestamptz | YES | - | Soft delete timestamp |
| **deleted_by** | uuid | YES | - | User ID thực hiện xóa |
| **deletion_reason** | text | YES | - | Lý do xóa |

### Ví dụ INSERT đúng

\`\`\`sql
INSERT INTO traceability_lots (
  tlc,
  product_id,
  facility_id,
  batch_number,
  production_date,  -- BẮT BUỘC
  expiry_date,
  quantity,
  unit,
  status
) VALUES (
  'TLC-2024-001',
  '550e8400-e29b-41d4-a716-446655440000',  -- product UUID
  '660e8400-e29b-41d4-a716-446655440000',  -- facility UUID
  'BATCH-001',
  '2024-01-15',     -- production_date (NOT NULL)
  '2024-12-31',     -- expiry_date (nullable)
  1000.00,
  'kg',
  'active'
);
\`\`\`

---

## 2. CRITICAL_TRACKING_EVENTS (CTEs)

**Mục đích:** Lưu trữ các sự kiện truy xuất nguồn gốc quan trọng (CTE) theo FSMA 204

### Schema

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| **id** | uuid | NO | uuid_generate_v4() | Primary key |
| **tlc_id** | uuid | NO | - | Foreign key → traceability_lots.id |
| **event_type** | text | NO | - | harvest, cooling, packing, shipping, receiving, transformation |
| **event_date** | timestamptz | NO | - | Thời gian sự kiện xảy ra |
| **facility_id** | uuid | NO | - | Foreign key → facilities.id |
| **responsible_person** | text | NO | - | Người chịu trách nhiệm |
| **description** | text | YES | - | Mô tả chi tiết |
| **temperature** | numeric | YES | - | Nhiệt độ (°C) |
| **quantity_processed** | numeric | YES | - | Số lượng xử lý |
| **unit** | text | YES | - | Đơn vị |
| **location_details** | text | YES | - | Chi tiết vị trí |
| **created_at** | timestamptz | YES | now() | Thời gian tạo |
| **updated_at** | timestamptz | YES | now() | Thời gian cập nhật |
| **deleted_at** | timestamptz | YES | - | Soft delete timestamp |
| **deleted_by** | uuid | YES | - | User ID thực hiện xóa |
| **deletion_reason** | text | YES | - | Lý do xóa |

### Event Types cho từng Organization Type

| Organization Type | Allowed Event Types |
|------------------|-------------------|
| **farm** | harvest, cooling, initial_packing |
| **packing_house** | receiving, cooling, packing, shipping |
| **processor** | receiving, transformation, cooling, packing, shipping |
| **distributor** | receiving, shipping |
| **importer** | receiving, shipping |

### Ví dụ INSERT đúng

\`\`\`sql
INSERT INTO critical_tracking_events (
  tlc_id,
  event_type,
  event_date,
  facility_id,
  responsible_person,
  description,
  temperature,
  quantity_processed,
  unit
) VALUES (
  '770e8400-e29b-41d4-a716-446655440000',  -- TLC UUID
  'harvest',
  '2024-01-15 08:00:00+00',
  '660e8400-e29b-41d4-a716-446655440000',  -- facility UUID
  'Nguyen Van A',
  'Thu hoạch xoài cát Hòa Lộc',
  NULL,
  500.00,
  'kg'
);
\`\`\`

---

## 3. KEY_DATA_ELEMENTS (KDEs)

**Mục đích:** Lưu trữ các yếu tố dữ liệu quan trọng (KDE) cho mỗi CTE

### Schema

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| **id** | uuid | NO | uuid_generate_v4() | Primary key |
| **cte_id** | uuid | NO | - | Foreign key → critical_tracking_events.id |
| **kde_type** | text | NO | - | Loại KDE (location, product, quantity, etc.) |
| **key_name** | text | NO | - | Tên KDE (gps_coordinates, location_code, etc.) |
| **key_value** | text | NO | - | Giá trị KDE |
| **unit** | text | YES | - | Đơn vị (nếu có) |
| **is_required** | boolean | YES | false | KDE bắt buộc hay không |
| **created_at** | timestamptz | YES | now() | Thời gian tạo |
| **reference_document_id** | uuid | YES | - | Tham chiếu tài liệu |
| **deleted_at** | timestamptz | YES | - | Soft delete timestamp |
| **deleted_by** | uuid | YES | - | User ID thực hiện xóa |
| **deletion_reason** | text | YES | - | Lý do xóa |

### KDE Required Fields (theo event_type)

#### Harvest Event
- ✅ `gps_coordinates` (required)
- ✅ `location_code` (required)
- ✅ `harvest_date` (required) - Lưu trong KDE, không phải column
- ✅ `harvest_person` (required)

#### Cooling Event
- ✅ `temperature` (required)
- ✅ `cooling_duration` (optional)

#### Packing Event
- ✅ `package_type` (required)
- ✅ `quantity_packed` (required)

#### Shipping Event
- ✅ `destination` (required)
- ✅ `carrier_name` (required)
- ✅ `vehicle_id` (optional)

### Ví dụ INSERT đúng

\`\`\`sql
-- Insert KDE for harvest event
INSERT INTO key_data_elements (
  cte_id,
  kde_type,
  key_name,
  key_value,
  is_required
) VALUES 
-- GPS coordinates (lấy từ facilities.gps_coordinates)
('880e8400-e29b-41d4-a716-446655440000', 'location', 'gps_coordinates', '10.7769,106.7009', true),
-- Location code (lấy từ facilities.location_code)
('880e8400-e29b-41d4-a716-446655440000', 'location', 'location_code', 'FARM-001', true),
-- Harvest date
('880e8400-e29b-41d4-a716-446655440000', 'harvest', 'harvest_date', '2024-01-15', true),
-- Harvest person
('880e8400-e29b-41d4-a716-446655440000', 'harvest', 'harvest_person', 'Nguyen Van A', true);
\`\`\`

---

## 4. PRODUCTS

**Mục đích:** Lưu trữ thông tin sản phẩm

### Schema

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| **id** | uuid | NO | uuid_generate_v4() | Primary key |
| **company_id** | uuid | NO | - | Foreign key → companies.id |
| **product_code** | text | NO | - | Mã sản phẩm (unique) |
| **product_name** | text | NO | - | Tên sản phẩm |
| **product_name_vi** | text | YES | - | Tên tiếng Việt |
| **description** | text | YES | - | Mô tả |
| **category** | text | NO | - | Danh mục |
| **is_ftl** | boolean | YES | false | Có phải Food Traceability List không |
| **unit_of_measure** | text | NO | - | Đơn vị đo (kg, box, pallet) |
| **requires_cte** | boolean | YES | true | Yêu cầu CTE |
| **created_at** | timestamptz | YES | now() | Thời gian tạo |
| **updated_at** | timestamptz | YES | now() | Thời gian cập nhật |
| **deleted_at** | timestamptz | YES | - | Soft delete timestamp |
| **deleted_by** | uuid | YES | - | User ID thực hiện xóa |
| **deletion_reason** | text | YES | - | Lý do xóa |

---

## 5. FACILITIES

**Mục đích:** Lưu trữ thông tin cơ sở (farm, packing house, warehouse, etc.)

### Schema

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| **id** | uuid | NO | uuid_generate_v4() | Primary key |
| **company_id** | uuid | NO | - | Foreign key → companies.id |
| **name** | text | NO | - | Tên cơ sở |
| **facility_type** | text | NO | - | Loại cơ sở |
| **location_code** | text | NO | - | ⚠️ Mã định vị (unique) |
| **address** | text | NO | - | Địa chỉ |
| **gps_coordinates** | text | YES | - | Tọa độ GPS (latitude,longitude) |
| **certification_status** | text | YES | - | Trạng thái chứng nhận |
| **fda_facility_number** | text | YES | - | FDA Facility Number |
| **duns_number** | text | YES | - | DUNS Number |
| **fda_registration_date** | date | YES | - | Ngày đăng ký FDA |
| **fda_expiry_date** | date | YES | - | Ngày hết hạn FDA |
| **fda_status** | text | YES | 'pending' | Trạng thái FDA |
| **fda_registration_status** | text | YES | 'pending' | Trạng thái đăng ký |
| **registration_email** | text | YES | - | Email đăng ký |
| **agent_registration_date** | date | YES | - | Ngày đăng ký US Agent |
| **agent_expiry_date** | date | YES | - | Ngày hết hạn US Agent |
| **agent_registration_years** | integer | YES | 1 | Số năm đăng ký |
| **created_at** | timestamptz | YES | now() | Thời gian tạo |
| **updated_at** | timestamptz | YES | now() | Thời gian cập nhật |
| **deleted_at** | timestamptz | YES | - | Soft delete timestamp |
| **deleted_by** | uuid | YES | - | User ID thực hiện xóa |
| **deletion_reason** | text | YES | - | Lý do xóa |

### Facility Types

- `farm` - Nông trại
- `packing_house` - Nhà đóng gói
- `cooling_facility` - Kho lạnh
- `warehouse` - Kho hàng
- `processing_plant` - Nhà máy chế biến
- `distribution_center` - Trung tâm phân phối

---

## 6. RELATIONSHIPS (Foreign Keys)

\`\`\`
companies (1) ──→ (many) facilities
companies (1) ──→ (many) products

facilities (1) ──→ (many) traceability_lots
products (1) ──→ (many) traceability_lots

traceability_lots (1) ──→ (many) critical_tracking_events
critical_tracking_events (1) ──→ (many) key_data_elements
facilities (1) ──→ (many) critical_tracking_events
\`\`\`

---

## 7. COMMON MISTAKES & SOLUTIONS

### ❌ Mistake 1: Trying to use `harvest_date` column
\`\`\`sql
-- SAI
INSERT INTO traceability_lots (harvest_date, ...)
\`\`\`

### ✅ Solution: Use `production_date` instead
\`\`\`sql
-- ĐÚNG
INSERT INTO traceability_lots (production_date, ...)
\`\`\`

---

### ❌ Mistake 2: Using `location_glo_code`
\`\`\`sql
-- SAI
SELECT location_glo_code FROM facilities
\`\`\`

### ✅ Solution: Use `location_code` instead
\`\`\`sql
-- ĐÚNG
SELECT location_code FROM facilities
\`\`\`

---

### ❌ Mistake 3: Missing required KDEs for harvest events
\`\`\`sql
-- SAI - Chỉ insert CTE mà không có KDEs
INSERT INTO critical_tracking_events (event_type, ...) VALUES ('harvest', ...);
\`\`\`

### ✅ Solution: Always insert required KDEs after CTE
\`\`\`sql
-- ĐÚNG
-- 1. Insert CTE first
INSERT INTO critical_tracking_events (...) VALUES (...) RETURNING id;

-- 2. Then insert required KDEs
INSERT INTO key_data_elements (cte_id, key_name, key_value, is_required) VALUES
(cte_id, 'gps_coordinates', '10.7769,106.7009', true),
(cte_id, 'location_code', 'FARM-001', true),
(cte_id, 'harvest_date', '2024-01-15', true);
\`\`\`

---

## 8. SEED DATA TEMPLATE

Xem file: `scripts/205_correct_seed_data_template.sql`

---

## 9. VALIDATION FUNCTIONS

Hệ thống có các trigger functions để validate dữ liệu:

1. **validate_cte_kdes_v2()** - Kiểm tra KDEs bắt buộc cho mỗi event type
2. **auto_alert_missing_kde()** - Tạo alert khi thiếu KDEs bắt buộc

**Lưu ý:** Các functions này sẽ lấy `gps_coordinates` và `location_code` từ bảng `facilities`, KHÔNG phải từ bảng `critical_tracking_events`.

---

## 10. SUPPORT

Nếu gặp lỗi khi seed data, hãy kiểm tra:
1. Có dùng đúng tên cột (`production_date`, `location_code`) không?
2. Có insert đầy đủ KDEs bắt buộc sau mỗi CTE không?
3. Có đảm bảo các foreign keys tồn tại không?
4. Có đúng event_type được phép cho organization_type không?

**Last Updated:** 2024-12-25
**Schema Version:** 1.0
