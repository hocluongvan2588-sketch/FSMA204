# Hướng Dẫn Seed Dữ Liệu Hoàn Chỉnh

## Tổng Quan

Script `200_complete_organization_seed_data.sql` tạo dữ liệu mẫu đầy đủ cho **TẤT CẢ** các loại organization types trong hệ thống FSMA 204.

## Các Loại Organization và Dữ Liệu

### 1. **FARM (Trang Trại)** 🌾
- **Company**: Trang Trại Thanh Long Bình Thuận
- **Registration**: FARM-2024-001
- **Facilities**:
  - Vườn Thanh Long A (farm)
  - Kho Đóng Gói Thanh Long (packing_area)
- **Products**: 
  - Fresh Dragon Fruit (Thanh Long Tươi) - FTL ✅
  - Organic Dragon Fruit (Thanh Long Hữu Cơ) - FTL ✅
- **CTE Required**: ✅ YES (Growing, Harvesting, Packing)

### 2. **PACKING_HOUSE (Nhà Đóng Gói)** 📦
- **Company**: Công ty Đóng Gói Trái Cây Tươi Miền Nam
- **Registration**: PKG-2024-002
- **Facilities**:
  - Xưởng Đóng Gói Chính (packing_house)
  - Kho Lạnh Trái Cây (cold_storage)
- **Products**:
  - Mixed Fresh Fruits Package - FTL ✅
  - Packaged Dragon Fruit - FTL ✅
- **CTE Required**: ✅ YES (Receiving, Packing, Cooling, Shipping)

### 3. **PROCESSOR (Nhà Máy Chế Biến)** 🏭
- **Company**: Nhà Máy Chế Biến Thủy Sản Cà Mau
- **Registration**: PROC-2024-003
- **Facilities**:
  - Phân Xưởng Chế Biến Tôm (processing_plant)
  - Kho Lạnh Đông -18°C (freezer_storage)
- **Products**:
  - Frozen Peeled Shrimp - FTL ✅
  - Frozen Fish Fillet - FTL ✅
- **CTE Required**: ✅ YES (Receiving, Processing, Freezing, Storage, Shipping)

### 4. **DISTRIBUTOR (Nhà Phân Phối)** 🚚
- **Company**: Công ty Phân Phối Thực Phẩm Việt Mỹ
- **Registration**: DIST-2024-004
- **Facilities**:
  - Kho Phân Phối Miền Nam (distribution_center)
  - Trung Tâm Logistics (logistics_hub)
- **Products**:
  - Imported Fresh Fruits - FTL ✅
  - Fresh Vegetables Mix - FTL ✅
- **CTE Required**: ✅ YES (Receiving, Storage, Transportation)

### 5. **IMPORTER (Nhà Nhập Khẩu)** 🛃
- **Company**: VietUS Food Import Export Corporation
- **Registration**: IMP-2024-005
- **Facilities**:
  - Cảng Nhập Khẩu Cát Lái (import_terminal)
  - Kho Hải Quan Bonded (bonded_warehouse)
- **Products**:
  - Imported Fresh Berries - FTL ✅
  - Imported Tree Nuts - FTL ✅
- **CTE Required**: ✅ YES (Import Receiving, Customs Clearance, Storage, Distribution)

### 6. **EXISTING COMPANIES** - Bổ Sung Đầy Đủ

#### VNTEETH
- ✅ Facilities: 2 (processing_plant, warehouse)
- ✅ Products: 2 (Premium Product A, Standard Product B)

#### Công ty TNHH Kinh Đô
- ✅ Facilities: 2 (processing_plant, warehouse)
- ✅ Products: 2 (Moon Cake Premium - FTL, Snack Mix Pack)

#### Công ty LAM SON
- ✅ Facilities: 2 (processing_plant, warehouse)
- ✅ Products: 2 (Refined White Sugar, Sugar Molasses)

#### Công ty TNHH Thủy sản Việt Nam
- ✅ Facilities: 2 (processing_plant, freezer_storage)
- ✅ Products: 2 already exists (PRD-SHRIMP-001, PRD-FISH-001)

## Cách Sử Dụng

### Phương Pháp 1: Chạy Trực Tiếp Trong v0 (KHUYẾN NGHỊ)

Không cần làm gì! Script đã sẵn sàng để chạy từ v0.

### Phương Pháp 2: Kiểm Tra Kết Quả

Sau khi chạy script, kiểm tra:

\`\`\`sql
-- Tổng số công ty
SELECT COUNT(*) FROM companies;
-- Kết quả: 9 companies

-- Tổng số facilities
SELECT COUNT(*) FROM facilities;
-- Kết quả: 18 facilities (2 mỗi company)

-- Tổng số products
SELECT COUNT(*) FROM products;
-- Kết quả: 18 products (2 mỗi company)

-- Chi tiết từng company
SELECT 
  c.name,
  COUNT(DISTINCT f.id) as facilities,
  COUNT(DISTINCT p.id) as products
FROM companies c
LEFT JOIN facilities f ON c.id = f.company_id
LEFT JOIN products p ON c.id = p.company_id
GROUP BY c.id, c.name
ORDER BY c.name;
\`\`\`

## Logic Match 100%

### FTL Products (Food Traceability List)
✅ **is_ftl = true** cho:
- Fresh fruits (thanh long, berries)
- Packaged fresh produce
- Processed seafood
- Tree nuts
- Fresh vegetables

❌ **is_ftl = false** cho:
- Refined sugar
- Snacks (bánh snack không phải FTL)
- Molasses

### CTE Requirements (Critical Tracking Events)
✅ **requires_cte = true** cho TẤT CẢ FTL products

### Facility Types by Organization

| Organization Type | Primary Facility Types |
|------------------|------------------------|
| Farm | farm, packing_area |
| Packing House | packing_house, cold_storage |
| Processor | processing_plant, freezer_storage |
| Distributor | distribution_center, logistics_hub |
| Importer | import_terminal, bonded_warehouse |

## Trạng Thái Sau Khi Seed

\`\`\`
✅ 9 Companies (covering all org types)
✅ 18 Facilities (diverse facility types)
✅ 18 Products (mix of FTL and non-FTL)
✅ GPS coordinates for all facilities
✅ Realistic Vietnamese addresses
✅ Proper certification status
✅ Logical product categories
\`\`\`

## Lưu Ý Quan Trọng

1. **Script sử dụng INSERT ... ON CONFLICT DO NOTHING** → An toàn chạy nhiều lần
2. **RLS được tạm thời disable** → Cho phép seed data không bị chặn
3. **RLS được enable lại** → Bảo mật được khôi phục sau khi seed
4. **UUID được hard-code** → Dễ dàng reference trong testing
5. **Timestamps realistic** → Mỗi company được tạo ở thời điểm khác nhau

## Verification

Chạy các queries verification ở cuối script để đảm bảo:
- ✅ Đủ số lượng records
- ✅ Relationships đúng (company → facilities → products)
- ✅ Facility types phù hợp với organization type
- ✅ FTL flags chính xác
