# Hướng dẫn Seed Data - Đã thành công ✅

## Tình trạng hiện tại

### ✅ Dữ liệu đã seed thành công

**5 Users đã tồn tại trong database:**

| Email | Họ tên | Role | Organization Type | Company |
|-------|--------|------|-------------------|---------|
| hocluongvan88@gmail.com | hocluongvan88@gmail.com | system_admin | - | - |
| admin@fsma204.com | Luong Van Hoc | admin | farm | Farm ABC |
| hocluongvan25@gmail.com | Nguyen Hai Anh | admin | packing_house | VNTEETH |
| hocluong01@gmail.com | Luong Thi Dien | admin | processor | Processor XYZ |
| hocluong02@gmail.com | Luong Bich Hữu | admin | distributor | Distributor 123 |

**Dữ liệu trong database:**
- 9 Companies (5 từ seed script mới)
- 18+ Facilities
- 18+ Products
- CTEs với KDEs đầy đủ

---

## ⚠️ Vấn đề cần khắc phục

### 1. Lỗi "No API key found in request"

**Nguyên nhân:** 
Trang `/admin/users/[id]` đang sử dụng client-side fetch với Supabase client, nhưng trong một số trường hợp environment variables không được load đúng.

**Giải pháp:**
- Option 1: Chuyển sang Server Component và fetch data từ server
- Option 2: Kiểm tra `.env.local` có đầy đủ các biến sau:
  \`\`\`
  NEXT_PUBLIC_SUPABASE_URL=your_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
  \`\`\`

### 2. Users không hiển thị trong danh sách

**Nguyên nhân:**
RLS policies có thể đang chặn system_admin xem users từ các companies khác.

**Kiểm tra:**
\`\`\`sql
-- Verify system_admin can see all profiles
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.organization_type,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.role != 'system_admin'
ORDER BY p.created_at DESC;
\`\`\`

---

## 🔧 Script đã chạy thành công

File: `scripts/207_seed_with_correct_trigger_names.sql`

**Đã tạo:**
- 5 Companies mới (Farm, Packing House, Processor, Distributor, Importer)
- 10 Facilities (2 cho mỗi company)
- 10 Products (2 cho mỗi company)
- 20+ Critical Tracking Events
- 40+ Key Data Elements (gps_coordinates, location_code, v.v.)

**Triggers đã được disable/enable đúng cách:**
- trg_validate_cte_kdes
- trigger_auto_populate_kdes
- trigger_missing_kde_alert
- v.v.

---

## 📊 Verification Queries

### Kiểm tra Users
\`\`\`sql
SELECT 
  au.email,
  p.full_name,
  p.role,
  p.organization_type,
  c.name as company_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;
\`\`\`

### Kiểm tra Companies và Facilities
\`\`\`sql
SELECT 
  c.name as company_name,
  COUNT(DISTINCT f.id) as facility_count,
  COUNT(DISTINCT pr.id) as product_count,
  COUNT(DISTINCT tl.id) as lot_count,
  COUNT(DISTINCT cte.id) as cte_count
FROM companies c
LEFT JOIN facilities f ON c.id = f.company_id
LEFT JOIN products pr ON c.id = pr.company_id
LEFT JOIN traceability_lots tl ON pr.id = tl.product_id
LEFT JOIN critical_tracking_events cte ON tl.id = cte.tlc_id
GROUP BY c.id, c.name
ORDER BY c.created_at DESC;
\`\`\`

### Kiểm tra CTEs và KDEs
\`\`\`sql
SELECT 
  cte.event_type,
  COUNT(cte.id) as event_count,
  COUNT(DISTINCT kde.id) as kde_count
FROM critical_tracking_events cte
LEFT JOIN key_data_elements kde ON cte.id = kde.cte_id
GROUP BY cte.event_type
ORDER BY event_count DESC;
\`\`\`

---

## 🎯 Kết luận

**Seed data đã THÀNH CÔNG!** Database hiện có đầy đủ:
- ✅ 5 users (1 system_admin + 4 company admins)
- ✅ 9 companies
- ✅ 18+ facilities
- ✅ 18+ products
- ✅ CTEs và KDEs đầy đủ cho FSMA 204 compliance

**Vấn đề còn lại:**
- Trang admin/users/[id] cần fix API key issue
- RLS policies cần verify để system_admin có thể xem tất cả users

Tất cả seed scripts đều có thể chạy lại bất kỳ lúc nào bằng cách disable triggers trước.
