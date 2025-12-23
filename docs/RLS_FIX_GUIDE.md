# RLS Fix Guide - Giải quyết lỗi Infinite Recursion

## Vấn đề đã gặp

### 1. Lỗi Infinite Recursion (42P17)
\`\`\`
Error: infinite recursion detected in policy for relation "profiles"
\`\`\`

**Nguyên nhân:** RLS policies query lại chính bảng `profiles` để kiểm tra quyền, tạo ra vòng lặp vô hạn.

### 2. Rò rỉ dữ liệu giữa các công ty
Admin công ty A có thể xem thống kê của tất cả các công ty thay vì chỉ công ty của mình.

### 3. Toast màu đỏ không hiển thị text
`--destructive-foreground` có cùng màu với `--destructive` (đỏ trên đỏ).

## Giải pháp đã áp dụng

### 1. RLS Policies - Simple & Non-Recursive
**File:** `scripts/017_ultimate_rls_fix_v2.sql`

- ✅ Xóa TẤT CẢ policies cũ có đệ quy
- ✅ Tạo 3 policies đơn giản:
  - Users chỉ xem được profile của chính mình
  - Users chỉ update được profile của chính mình
  - Users chỉ insert được profile của chính mình
- ✅ Admin operations sử dụng Service Role (bypass RLS)

### 2. Service Role Client
**File:** `lib/supabase/service-role.ts`

Tạo client với service role key để:
- Bypass RLS policies
- Admin xem được tất cả users
- Tạo/sửa/xóa users

### 3. API Routes với Authorization
**Files:** 
- `app/api/admin/stats/route.ts` - Statistics
- `app/api/admin/users/route.ts` - User management

- ✅ Verify authentication
- ✅ Check admin role
- ✅ Filter data theo company cho non-system admin
- ✅ Use service role client để bypass RLS

### 4. Fix Toast Styling
**File:** `app/globals.css`

\`\`\`css
/* Before */
--destructive-foreground: oklch(0.577 0.245 27.325); /* Màu đỏ */

/* After */
--destructive-foreground: oklch(0.985 0 0); /* Màu trắng */
\`\`\`

## Hướng dẫn chạy Script

### Bước 1: Chạy SQL Script
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy nội dung file `scripts/017_ultimate_rls_fix_v2.sql`
4. Paste và chạy
5. Kiểm tra output - phải thấy "RLS FIX v2 APPLIED SUCCESSFULLY"

### Bước 2: Kiểm tra Policies
\`\`\`sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
\`\`\`

Kết quả mong đợi:
- `view_own_profile` - SELECT
- `update_own_profile` - UPDATE
- `insert_own_profile` - INSERT

### Bước 3: Test
1. Đăng nhập với System Admin → Phải xem được tất cả users
2. Đăng nhập với Company Admin → Chỉ xem được users công ty mình
3. Kiểm tra toast màu đỏ → Phải thấy rõ text màu trắng

## Bảo mật

### Cách hoạt động
1. **RLS Layer:** Users chỉ truy cập được data của chính mình
2. **Application Layer:** API routes kiểm tra role và filter data
3. **Service Role:** Chỉ sử dụng trong server-side code, không expose ra client

### Data Isolation
- ✅ System Admin: Xem tất cả
- ✅ Company Admin: Chỉ xem company của mình
- ✅ Regular Users: Chỉ xem profile của mình
- ✅ Admin không thể xem data của admin khác công ty

## Troubleshooting

### Lỗi "SUPABASE_SERVICE_ROLE_KEY not found"
**Giải pháp:** Thêm service role key vào environment variables trong Vercel/local .env

### Lỗi "Forbidden - Admin access required"
**Nguyên nhân:** User không có quyền admin
**Giải pháp:** Kiểm tra role trong bảng profiles

### Stats hiển thị 0
**Nguyên nhân:** API route chưa được gọi hoặc lỗi
**Giải pháp:** Check browser console và network tab

## Summary

✅ **Fixed:** Infinite recursion error
✅ **Fixed:** Data leakage between companies  
✅ **Fixed:** Toast text visibility
✅ **Implemented:** Proper authorization với service role
✅ **Secured:** Multi-tenant data isolation
