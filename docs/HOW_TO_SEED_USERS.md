# Hướng dẫn Seed Users cho Hệ thống FSMA 204

## Tổng quan

Có 3 cách để tạo users trong hệ thống:

1. **Qua Admin Panel** (/admin/users) - KHUYẾN NGHỊ cho production
2. **Qua Supabase Dashboard** - Tốt cho development/testing
3. **Qua SQL Scripts** - Tốt cho seed data hàng loạt

## Cách 1: Tạo User qua Admin Panel (Khuyến nghị)

### Điều kiện
- Bạn đã đăng nhập với tài khoản `system_admin`
- Company đã được tạo trước đó

### Các bước

1. Đăng nhập với tài khoản system_admin
2. Vào trang `/admin/users`
3. Click nút "+ Tạo người dùng mới"
4. Điền thông tin:
   - Email
   - Password
   - Họ tên
   - Vai trò (admin, manager, operator, viewer)
   - Số điện thoại
   - Company
   - Loại tổ chức (packing_house, farm, distributor, etc.)
5. Click "Tạo người dùng"

### Ưu điểm
- Tự động tạo cả auth user và profile
- Có validation đầy đủ
- Không cần truy cập Supabase Dashboard
- Thân thiện với người dùng

## Cách 2: Tạo User qua Supabase Dashboard

### Các bước

1. **Tạo Auth User:**
   - Vào Supabase Dashboard → Authentication → Users
   - Click "Add User" → "Create New User"
   - Nhập:
     - Email: `nguyen@vnteeth.com`
     - Password: `Password@123`
     - Auto Confirm User: **YES**
   - Click "Create User"
   - **Copy UUID của user vừa tạo**

2. **Tạo Profile:**
   - Vào SQL Editor
   - Chạy query:
   
   \`\`\`sql
   INSERT INTO profiles (
     id,                                           -- UUID từ bước 1
     company_id,                                   -- UUID của company
     full_name,
     role,                                         -- 'admin', 'manager', 'operator', 'viewer'
     email,
     phone,
     language_preference
   ) VALUES (
     'USER_UUID_FROM_STEP_1',                     -- Thay bằng UUID thực tế
     'COMPANY_UUID',                               -- ID của VNTEETH company
     'Nguyen Hai Anh',
     'admin',
     'nguyen@vnteeth.com',
     '099987654323',
     'vi'
   );
   \`\`\`

### Ưu điểm
- Kiểm soát đầy đủ
- Tốt cho debugging
- Không phụ thuộc vào UI

## Cách 3: Seed Users bằng SQL Script

### File Script

Sử dụng file: `scripts/099_seed_demo_users.sql`

### Các bước

1. **Lấy Company ID:**
   \`\`\`sql
   SELECT id, name FROM companies WHERE name = 'VNTEETH';
   \`\`\`

2. **Tạo Auth Users qua Dashboard:**
   - Tạo các users như Cách 2 (bước 1)
   - Copy UUIDs của tất cả users

3. **Chỉnh sửa Script:**
   - Mở file `scripts/099_seed_demo_users.sql`
   - Uncomment các sections cần thiết
   - Thay thế `YOUR_ADMIN_USER_ID`, `YOUR_MANAGER_USER_ID`, etc. bằng UUIDs thực tế

4. **Chạy Script:**
   - Copy toàn bộ script
   - Paste vào Supabase SQL Editor
   - Click "Run"

### Ưu điểm
- Tạo nhiều users cùng lúc
- Dễ dàng replicate cho môi trường khác
- Có thể version control

## Các Roles trong Hệ thống

| Role | Mô tả | Quyền hạn |
|------|-------|-----------|
| `system_admin` | Quản trị viên hệ thống | Quản lý toàn bộ hệ thống, tất cả companies |
| `admin` | Quản trị viên công ty | Quản lý users, facilities, products của company |
| `manager` | Quản lý | Quản lý operations, xem reports |
| `operator` | Người vận hành | Nhập liệu CTEs, traceability data |
| `viewer` | Người xem | Chỉ xem dữ liệu, không chỉnh sửa |

## Troubleshooting

### Lỗi: "Database error creating new user"

**Nguyên nhân:** RLS policies không cho phép insert vào profiles

**Giải pháp:** Đã được fix - system_admin có thể tạo profiles cho bất kỳ company nào

### Lỗi: "User already exists"

**Nguyên nhân:** Email đã được sử dụng

**Giải pháp:** 
- Kiểm tra trong auth.users: `SELECT * FROM auth.users WHERE email = 'email@example.com'`
- Xóa user cũ hoặc dùng email khác

### Lỗi: "Could not find the table 'public.companies'"

**Nguyên nhân:** Bảng companies chưa được tạo

**Giải pháp:** Chạy migration `scripts/001_create_schema.sql`

### Users không hiển thị trong /admin/users

**Nguyên nhân:** RLS policy không cho phép xem

**Giải pháp:** Đã được fix - system_admin có thể xem tất cả profiles

## Demo Users

Sau khi seed, bạn sẽ có các users sau cho company VNTEETH:

| Email | Password | Role | Họ tên |
|-------|----------|------|---------|
| admin@vnteeth.com | Admin@123456 | admin | Nguyen Hai Anh |
| manager@vnteeth.com | Manager@123456 | manager | Tran Van Manager |
| operator@vnteeth.com | Operator@123456 | operator | Le Thi Operator |

## Best Practices

1. **Production:** Luôn dùng Admin Panel để tạo users
2. **Development:** Dùng seed scripts để tạo demo data
3. **Security:** Đổi password ngay sau khi seed
4. **RLS:** Đảm bảo policies được apply đúng cho từng role
5. **Audit:** Log tất cả user creation actions

## Scripts Liên quan

- `scripts/001_create_schema.sql` - Tạo bảng profiles
- `scripts/002_create_profile_trigger.sql` - Trigger tự động tạo profile
- `scripts/003_seed_data.sql` - Seed companies và facilities
- `scripts/007_sync_missing_profiles.sql` - Sync profiles cho auth users
- `scripts/009_create_first_admin.sql` - Tạo system admin đầu tiên
- `scripts/099_seed_demo_users.sql` - Seed demo users (MỚI)

## Lưu ý quan trọng

1. **System Admin đầu tiên** phải được tạo thủ công qua Dashboard
2. **Profiles** tự động được tạo khi auth user được tạo (nhờ trigger)
3. **Company** phải tồn tại trước khi gán user vào company đó
4. **RLS Policies** đã được fix để system_admin có thể quản lý tất cả users
