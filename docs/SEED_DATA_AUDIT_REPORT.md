# BÁO CÁO KIỂM TOÁN DỮ LIỆU SEED & PHÂN LOẠI DOANH NGHIỆP

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Phân loại Organization Types trong hệ thống
Theo `lib/utils/cte-permissions.ts`:

| Organization Type | Quyền CTE Events |
|------------------|-----------------|
| **farm** | harvesting, cooling, packing, shipping |
| **packing_house** | receiving, cooling, packing, shipping |
| **processor** | receiving, transformation, cooling, packing, shipping |
| **distributor** | receiving, shipping |
| **retailer** | receiving |
| **port_operator** | receiving, transformation, shipping |

### 1.2. Users hiện tại trong database

| User | Company | Organization Type | Role |
|------|---------|------------------|------|
| Nguyen Hai Anh | VNTEETH | packing_house | admin |
| Luong Thi Dien | HALIMA | processor | admin |
| Nguyen Tien Luc | AN BINH | distributor | admin |
| Dao Tien Hai | AN BINH | retailer | admin |
| Luong Van Du | ANK EM | port_operator | admin |

### 1.3. CTE Events hiện tại trong database

| Event Type | Count | Description |
|-----------|-------|-------------|
| harvesting | 3 | Thu hoạch |
| cooling | 3 | Làm lạnh |
| packing | 2 | Đóng gói |
| receiving | 7 | Nhận hàng |
| shipping | 4 | Vận chuyển |
| transformation | 3 | Chế biến/Biến đổi |

## 2. PHÁT HIỆN LỖI LOGIC NGHIÊM TRỌNG

### 2.1. ❌ Seed Data CTE Events vi phạm quyền Organization Type

Trong file `scripts/100_comprehensive_test_seed_data.sql`:

**VNTEETH (packing_house)**
- ✅ ĐÚNG: receiving, cooling, packing, shipping
- ❌ SAI: **harvesting** (Line 124-128, 130-131, 133-134)
  - `harvesting` chỉ dành cho **farm**, không phải packing_house
  - CTE IDs: d1111111-...-111111111111, d1111111-...-111111111115, d1111111-...-111111111116

**HALIMA (processor)**
- ✅ ĐÚNG: receiving, transformation, cooling, packing
- Tất cả events đều hợp lệ

**AN BINH (distributor & retailer)**
- ✅ ĐÚNG: receiving, shipping
- Tất cả events đều hợp lệ

**ANK EM (port_operator)**
- ✅ ĐÚNG: receiving, transformation, cooling, shipping
- Tất cả events đều hợp lệ

### 2.2. ❌ Thiếu organization_type trong kde_requirements table

Bảng `kde_requirements` hiện tại:
\`\`\`sql
CREATE TABLE kde_requirements (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  kde_field TEXT NOT NULL,
  is_required BOOLEAN NOT NULL,
  ...
)
\`\`\`

**VẤN ĐỀ:** Không có cột `organization_type`, khiến hệ thống không thể enforce KDE requirements theo loại doanh nghiệp!

**HỆ QUẢ:** 
- Một packing_house có thể tạo CTE event "harvesting" (sai quyền)
- System check KDE cho "harvesting" event mà không quan tâm đó là packing_house (không nên có quyền này)
- Compliance score sai vì không lọc theo organization_type

## 3. KẾ HOẠCH KHẮC PHỤC

### 3.1. Fix script 104: Thêm organization_type vào kde_requirements

\`\`\`sql
-- PART 1: Add organization_type column to kde_requirements
ALTER TABLE kde_requirements 
ADD COLUMN IF NOT EXISTS organization_type TEXT[];

-- Update existing data to include all org types (backward compatible)
UPDATE kde_requirements
SET organization_type = ARRAY['farm', 'packing_house', 'processor', 'distributor', 'retailer', 'port_operator']
WHERE organization_type IS NULL;

-- PART 2: Insert KDE requirements WITH organization_type filter
-- Example: harvesting chỉ dành cho farm
INSERT INTO kde_requirements (..., organization_type)
VALUES (..., ARRAY['farm']);
\`\`\`

### 3.2. Fix script 100: Sửa seed data CTE events

**VNTEETH (packing_house):**
- XÓA: 3 CTE events "harvesting" (không hợp lệ)
- THAY THẾ: Bằng "receiving" events từ farm suppliers

### 3.3. Fix validation logic

Update `auto_alert_missing_kde()` function để check:
\`\`\`sql
-- Check if user's organization_type is allowed for this event_type
AND kr.organization_type @> ARRAY[p.organization_type]
\`\`\`

Update `calculate_realtime_compliance_score()` để:
\`\`\`sql
-- Only count CTEs that user is ALLOWED to create
WHERE EXISTS (
  SELECT 1 FROM kde_requirements kr
  WHERE kr.event_type = cte.event_type
    AND kr.organization_type @> ARRAY[p.organization_type]
)
\`\`\`

## 4. CHECKLIST KIỂM TOÁN

- [ ] Thêm `organization_type` column vào `kde_requirements` table
- [ ] Populate kde_requirements với organization_type constraints
- [ ] Xóa/sửa VNTEETH harvesting events trong seed data
- [ ] Update `auto_alert_missing_kde()` function với org_type check
- [ ] Update `calculate_realtime_compliance_score()` với org_type filter
- [ ] Update frontend `cte-permissions.ts` để sync với database
- [ ] Test: Packing house không thể tạo harvesting event
- [ ] Test: Compliance score chỉ tính CTEs hợp lệ theo org_type
- [ ] Verify: Tất cả 6 CTEs "Thiếu KDE" đều là violations thực sự

## 5. RECOMMENDED IMPLEMENTATION ORDER

1. **URGENT (24h):** Fix kde_requirements table schema + validation functions
2. **HIGH:** Update seed data to remove invalid CTEs
3. **MEDIUM:** Update frontend validation to prevent future violations
4. **LOW:** Add UI warnings when user attempts invalid event_type

## 6. KẾT LUẬN

Hệ thống hiện tại có **lỗ hổng logic nghiêm trọng** do:
1. Seed data tạo CTE events không phù hợp với organization_type
2. `kde_requirements` table thiếu cột `organization_type` để enforce constraints
3. Validation functions không check quyền tạo CTE theo loại doanh nghiệp

Cần fix ngay để đảm bảo:
- Compliance score chính xác 100%
- Chỉ CTEs hợp lệ được tính vào báo cáo
- FSMA 204 audit trail đúng chuẩn pháp lý
