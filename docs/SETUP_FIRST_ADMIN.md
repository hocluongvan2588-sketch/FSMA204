# Thiết lập tài khoản System Admin đầu tiên

## Vấn đề hiện tại

Database không có user nào, dẫn đến lỗi khi đăng nhập vì:
- Session cookie tồn tại nhưng user đã bị xóa khỏi database
- RLS policies yêu cầu profile tồn tại để tạo profile mới (infinite recursion)

## Giải pháp

### Bước 1: Tạo user qua Supabase Dashboard

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Authentication** → **Users**
4. Click **Add User** → **Create New User**
5. Điền thông tin:
   \`\`\`
   Email: admin@foodtrace.com
   Password: Admin@123456
   Auto Confirm User: ✓ YES (check this box)
   \`\`\`

6. Thêm User Metadata (click "Show metadata" nếu cần):
   \`\`\`json
   {
     "role": "system_admin",
     "full_name": "System Administrator",
     "language_preference": "vi"
   }
   \`\`\`

7. Click **Create User**
8. **Sao chép User UID** (UUID) sau khi tạo thành công

### Bước 2: Chạy SQL Script

1. Mở file `scripts/009_create_first_admin.sql`
2. Thay thế `YOUR_USER_ID_HERE` bằng User UID vừa sao chép
3. Chạy script trong Supabase SQL Editor hoặc từ v0

### Bước 3: Clear browser cache và đăng nhập lại

1. Mở DevTools (F12)
2. Vào tab **Application** → **Cookies**
3. Xóa tất cả cookies của localhost:3000
4. Hoặc đơn giản: Mở cửa sổ ẩn danh (Incognito)
5. Truy cập http://localhost:3000/auth/login
6. Đăng nhập với:
   \`\`\`
   Email: admin@foodtrace.com
   Password: Admin@123456
   \`\`\`

## Xác minh thành công

Sau khi đăng nhập thành công, bạn sẽ:
- Được redirect tự động đến `/admin` (vì role là system_admin)
- Có thể tạo users mới và quản lý hệ thống
- Không còn thấy lỗi "profile_missing" hoặc "infinite recursion"

## Lưu ý bảo mật

**QUAN TRỌNG**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

1. Vào trang profile/settings
2. Đổi mật khẩu mạnh hơn
3. Không chia sẻ thông tin đăng nhập

## Khắc phục sự cố

### Vẫn bị lỗi "infinite recursion"?

Chạy script fix RLS:
\`\`\`bash
# Trong v0, chạy script: scripts/008_fix_rls_recursion.sql
\`\`\`

### Không thể đăng nhập?

1. Kiểm tra user có tồn tại:
   \`\`\`sql
   SELECT id, email FROM auth.users WHERE email = 'admin@foodtrace.com';
   \`\`\`

2. Kiểm tra profile:
   \`\`\`sql
   SELECT * FROM profiles WHERE email = 'admin@foodtrace.com';
   \`\`\`

3. Xóa session cũ và thử lại:
   \`\`\`sql
   -- Clear all sessions (use with caution)
   DELETE FROM auth.sessions WHERE user_id IN (
     SELECT id FROM auth.users WHERE email = 'admin@foodtrace.com'
   );
