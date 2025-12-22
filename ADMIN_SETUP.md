# Hướng dẫn thiết lập tài khoản Admin đầu tiên

## Bước 1: Tạo tài khoản Admin qua Supabase Dashboard

Vì lý do bảo mật, tài khoản Admin đầu tiên phải được tạo thủ công qua Supabase Dashboard.

### Các bước thực hiện:

1. **Truy cập Supabase Dashboard**
   - Đăng nhập vào https://supabase.com
   - Chọn project của bạn

2. **Tạo User mới**
   - Vào menu **Authentication** → **Users**
   - Click nút **"Add user"** hoặc **"Invite user"**
   - Điền thông tin:
     - **Email**: `admin@yourcompany.com` (thay bằng email thật)
     - **Password**: Tạo mật khẩu mạnh (tối thiểu 8 ký tự)
     - **Auto Confirm User**: ✅ BẬT (để không cần xác nhận email)
   - Click **Create user**

3. **Copy User ID**
   - Sau khi tạo xong, click vào user vừa tạo
   - **Copy User UID** (dạng: `123e4567-e89b-12d3-a456-426614174000`)

## Bước 2: Tạo Profile cho Admin

### Option A: Dùng SQL Editor trong Supabase

1. Vào menu **SQL Editor**
2. Click **New query**
3. Paste đoạn code sau (thay `YOUR_USER_ID` bằng User UID đã copy):

\`\`\`sql
-- Thay YOUR_USER_ID bằng User UID thực tế
INSERT INTO profiles (id, company_id, full_name, role, phone, language_preference)
VALUES (
  'YOUR_USER_ID',  -- Thay bằng User UID
  NULL,            -- Admin hệ thống không thuộc công ty cụ thể
  'System Administrator',
  'admin',
  '+84-xxx-xxx-xxx',  -- Thay số điện thoại
  'vi'
);
\`\`\`

4. Click **Run** để thực thi

### Option B: Dùng Table Editor

1. Vào menu **Table Editor**
2. Chọn bảng **profiles**
3. Click **Insert** → **Insert row**
4. Điền thông tin:
   - **id**: Paste User UID đã copy
   - **company_id**: Để trống (NULL)
   - **full_name**: "System Administrator"
   - **role**: "admin"
   - **phone**: Số điện thoại của bạn
   - **language_preference**: "vi"
5. Click **Save**

## Bước 3: Đăng nhập lần đầu

1. Truy cập trang đăng nhập: `https://your-domain.com/auth/login`
2. Nhập email và password đã tạo ở Bước 1
3. Sau khi đăng nhập thành công, bạn sẽ thấy menu **"Quản trị"** → **"Quản lý người dùng"**

## Bước 4: Tạo tài khoản cho nhân viên

Giờ Admin có thể tạo tài khoản cho nhân viên trực tiếp trong hệ thống:

1. Vào **Dashboard** → **Quản trị** → **Quản lý người dùng**
2. Click nút **"+ Tạo người dùng mới"**
3. Điền thông tin nhân viên:
   - Email
   - Mật khẩu
   - Họ tên
   - Vai trò (Admin/Manager/Operator/Viewer)
   - Công ty (nếu có)
   - Số điện thoại
4. Click **"Tạo tài khoản"**

Nhân viên sẽ nhận được email thông báo và có thể đăng nhập ngay.

---

## Phân quyền hệ thống

| Vai trò | Quyền hạn |
|---------|-----------|
| **Admin** | Toàn quyền: Tạo user, quản lý công ty, xem tất cả dữ liệu |
| **Manager** | Quản lý công ty, cơ sở, sản phẩm, tạo báo cáo |
| **Operator** | Tạo CTE, TLC, vận chuyển, nhập liệu hàng ngày |
| **Viewer** | Chỉ xem, không chỉnh sửa |

---

## Lưu ý bảo mật

1. **Đổi mật khẩu ngay sau lần đăng nhập đầu tiên**
2. **Không chia sẻ tài khoản Admin** cho nhiều người
3. **Xóa tài khoản test/demo** sau khi triển khai production
4. **Kích hoạt 2FA** (Two-Factor Authentication) trong Supabase nếu có thể
5. **Backup dữ liệu định kỳ** qua Supabase Dashboard

---

## Troubleshooting

### Lỗi: "User not found"
- Kiểm tra User đã được tạo trong Supabase Authentication
- Đảm bảo User đã được confirm (Auto Confirm User = ON)

### Lỗi: "Profile not found"
- Kiểm tra profile đã được tạo trong bảng `profiles`
- Đảm bảo `id` trong profiles trùng với User UID

### Không thấy menu "Quản trị"
- Kiểm tra `role` trong bảng profiles phải là `'admin'` (viết thường)
- Logout và login lại để load lại profile

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề trong quá trình setup, vui lòng liên hệ:
- Email: support@foodtrace.com
- Hotline: 1900-xxxx (giờ hành chính)
