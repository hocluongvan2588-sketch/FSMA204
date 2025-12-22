# Hướng dẫn sửa lỗi Profile Missing

## Vấn đề

Người dùng có thể đăng nhập (có User ID trong auth.users) nhưng không có record trong bảng `profiles`, dẫn đến lỗi:
- `Profile: null`
- `Role: undefined`
- Không thể truy cập dashboard hoặc admin panel

## Nguyên nhân

1. **User được tạo trước khi trigger được cài đặt**: Nếu user được tạo trong auth.users trước khi chạy script `002_create_profile_trigger.sql`, profile sẽ không được tự động tạo.

2. **Trigger bị lỗi khi chạy**: Nếu trigger gặp lỗi trong quá trình chạy (ví dụ: thiếu quyền, vi phạm constraint), profile sẽ không được tạo.

3. **Profile bị xóa thủ công**: Admin có thể vô tình xóa profile trong database.

## Giải pháp đã triển khai

### 1. Auto-create Profile Helper (`lib/supabase/profile-helpers.ts`)

Chúng tôi đã tạo helper function `ensureProfileExists()` để:
- Kiểm tra xem user có profile không
- Tự động tạo profile nếu không tồn tại
- Lấy thông tin từ `user_metadata` hoặc dùng giá trị mặc định

\`\`\`typescript
const { profile } = await ensureProfileExists(user)
\`\`\`

### 2. Cập nhật Layout Files

Cả `app/dashboard/layout.tsx` và `app/admin/layout.tsx` đều sử dụng `ensureProfileExists()` để đảm bảo profile luôn tồn tại trước khi render.

### 3. Sync Script cho Database (`scripts/007_sync_missing_profiles.sql`)

Script này quét tất cả users trong `auth.users` và tạo profile cho những user chưa có:

\`\`\`sql
-- Chạy script để sync profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Tạo profile...
  END LOOP;
END $$;
\`\`\`

### 4. Improved Error Handling

Login page giờ hiển thị thông báo lỗi rõ ràng nếu profile không tồn tại và redirect về login với message phù hợp.

## Cách khắc phục ngay

### Option 1: Chạy Sync Script (Khuyến nghị)

\`\`\`bash
# Trong v0, script này đã được tạo ở scripts/007_sync_missing_profiles.sql
# Chạy nó để sync tất cả profiles còn thiếu
\`\`\`

Script sẽ:
- Tìm tất cả users không có profile
- Tự động tạo profile với role từ metadata hoặc mặc định là 'viewer'
- Log kết quả

### Option 2: Tạo Profile thủ công

Nếu bạn biết User ID cụ thể:

\`\`\`sql
INSERT INTO profiles (id, full_name, role, language_preference, created_at, updated_at)
VALUES (
  'USER_ID_HERE',
  'Tên người dùng',
  'viewer', -- hoặc 'admin', 'system_admin'
  'vi',
  NOW(),
  NOW()
);
\`\`\`

### Option 3: Đăng xuất và đăng nhập lại

Với helper function mới, việc đăng nhập lại sẽ tự động tạo profile nếu thiếu.

1. Đăng xuất khỏi hệ thống
2. Xóa cookies/session
3. Đăng nhập lại
4. Profile sẽ được tạo tự động

## Kiểm tra Profile

### Kiểm tra trong Database

\`\`\`sql
-- Kiểm tra user có profile không
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = 'USER_ID_HERE';
\`\`\`

### Kiểm tra tất cả users thiếu profile

\`\`\`sql
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
\`\`\`

## Ngăn chặn vấn đề trong tương lai

1. **Đảm bảo trigger hoạt động**: Chạy `002_create_profile_trigger.sql` trước khi tạo users
2. **Không xóa profiles trực tiếp**: Nếu cần xóa user, xóa từ auth.users (cascade sẽ xóa profile)
3. **Monitor logs**: Kiểm tra Supabase logs nếu có lỗi trigger
4. **Sử dụng ensureProfileExists()**: Luôn dùng helper này trong server components cần profile

## Debug Logs

Khi gặp vấn đề, kiểm tra console logs:

\`\`\`
[v0] Dashboard Layout - User ID: xxx
[v0] Dashboard Layout - Profile: null  ← VẤN ĐỀ
[v0] Dashboard Layout - Role: undefined ← VẤN ĐỀ
\`\`\`

Sau khi fix:

\`\`\`
[v0] Dashboard Layout - User ID: xxx
[v0] Dashboard Layout - Profile: { id: xxx, role: 'viewer', ... }
[v0] Dashboard Layout - Role: viewer ← ĐÃ FIX
\`\`\`

## Liên hệ

Nếu vấn đề vẫn tiếp diễn sau khi thực hiện các bước trên, liên hệ team phát triển với thông tin:
- User ID
- Email
- Error logs từ console
- Kết quả query kiểm tra profile
