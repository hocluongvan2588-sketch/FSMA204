# THỨ TỰ CHẠY SCRIPT - QUAN TRỌNG!

## RESET DATABASE (Xóa toàn bộ để chạy lại)

### 0. 000-RESET-DATABASE.sql ⚠️ 
**Mục đích:** Xóa TOÀN BỘ database về trạng thái ban đầu
**Khi nào dùng:** Khi muốn reset hoàn toàn và chạy lại từ đầu
**Cảnh báo:** Script này sẽ XÓA TẤT CẢ dữ liệu!

```sql
-- Chạy script này để xóa sạch:
-- ✅ Tất cả triggers
-- ✅ Tất cả functions
-- ✅ Tất cả tables
-- ✅ Tất cả types
-- ✅ Tất cả policies
```

**SAU KHI CHẠY 000-RESET-DATABASE.sql, tiếp tục với các bước dưới đây:**

---

## SETUP SERVER MỚI - Chạy theo thứ tự sau:

### 1. COMPLETE_MASTER_DATABASE.sql
**Mục đích:** Tạo toàn bộ cấu trúc database (36 tables + indexes)
**Chạy:** Lần đầu tiên khi setup database mới
```bash
# Chạy file này TRƯỚC TIÊN
```

### 2. 001-seed-service-packages.sql  
**Mục đích:** Seed 5 gói dịch vụ (Free, Starter, Professional, Business, Enterprise)
**Chạy:** Sau khi tạo xong tables
```bash
# Phải có Free package để trigger handle_new_user hoạt động
```

### 3. FINAL_COMPLETE_RLS_POLICIES.sql
**Mục đích:** Setup toàn bộ RLS policies cho 36+ bảng
**Quan trọng:** File này tạo helper functions và policies đúng
- Tạo `get_user_company_id()` và `get_user_role()` với SECURITY DEFINER
- Tạo policies cho companies, profiles, company_subscriptions cho phép INSERT
```bash
# File này ĐÃ ĐÚNG - cho phép authenticated users insert vào companies
```

### 4. FIX_HANDLE_NEW_USER_TRIGGER_V2.sql
**Mục đích:** Tạo trigger `handle_new_user` để tự động tạo company + profile + subscription khi user đăng ký
**Fix:** Query `name = 'Free'` thay vì `package_code = 'FREE'`
```bash
# Trigger này chạy với SECURITY DEFINER nên bypass RLS
```

### 5. MASTER_TRIGGER_FIXES.sql
**Mục đích:** Fix các trigger cho CTE (Critical Tracking Events)
**Chạy:** Sau khi setup xong authentication trigger
```bash
# Fix auto_populate_kdes, validate_chronological_order, etc.
```

### 6. add_*.sql files (Optional - chỉ chạy nếu cần)
- add_language_preference_to_profiles.sql
- add_organization_type_to_profiles.sql  
- add_allowed_cte_types_to_profiles.sql

---

## SCRIPT KHÔNG CẦN CHẠY (ĐÃ GỘP VÀO FINAL_COMPLETE_RLS_POLICIES.sql):

❌ **fix_profiles_rls_insert_policy.sql** - ĐÃ CŨ, đã được gộp vào FINAL_COMPLETE_RLS_POLICIES.sql
❌ **FIX_HANDLE_NEW_USER_TRIGGER.sql** - Dùng V2 thay thế

---

## TẠI SAO LỖI "Database error creating new user"?

### Nguyên nhân:
1. ❌ Script `fix_profiles_rls_insert_policy.sql` chạy SAU và GHI ĐÈ policies từ `FINAL_COMPLETE_RLS_POLICIES.sql`
2. ❌ Policy cũ chỉ cho phép `system_admin` insert vào companies
3. ❌ Trigger `handle_new_user` không thể tạo company do RLS chặn

### Giải pháp:
✅ KHÔNG chạy `fix_profiles_rls_insert_policy.sql`  
✅ CHỈ chạy `FINAL_COMPLETE_RLS_POLICIES.sql` (đã có policy đúng)
✅ Chạy `FIX_HANDLE_NEW_USER_TRIGGER_V2.sql` (query đúng `name = 'Free'`)

---

## KIỂM TRA SAU KHI CHẠY:

```sql
-- 1. Kiểm tra Free package tồn tại
SELECT * FROM service_packages WHERE name = 'Free';

-- 2. Kiểm tra policies đã đúng
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('companies', 'profiles', 'company_subscriptions')
ORDER BY tablename, policyname;

-- 3. Kiểm tra trigger tồn tại
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 4. Kiểm tra function handle_new_user
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

---

## GHI CHÚ QUAN TRỌNG:

1. **Không bao giờ** chạy `fix_profiles_rls_insert_policy.sql` nếu đã chạy `FINAL_COMPLETE_RLS_POLICIES.sql`
2. **Luôn luôn** chạy theo thứ tự: Database → Seed → RLS → Triggers
3. **Trigger** `handle_new_user` cần:
   - Free package phải tồn tại (name = 'Free')
   - RLS policy cho phép authenticated users insert vào companies
   - Function chạy với SECURITY DEFINER để bypass RLS

---

## THỬ NGHIỆM TẠO USER:

Sau khi chạy đủ 5 script trên, thử tạo user từ Supabase dashboard:
- Email: test@example.com
- Password: test123456
- Auto Confirm: ✅ (checked)

Nếu thành công, bạn sẽ thấy:
- ✅ User được tạo trong auth.users
- ✅ Profile được tạo trong profiles
- ✅ Company được tạo trong companies (với registration_number unique)
- ✅ Subscription được tạo trong company_subscriptions (Free package)
