# 📚 TÀI LIỆU HỆ THỐNG PHÂN QUYỀN (RBAC)

**Hệ thống quản lý chuỗi cung ứng thực phẩm FSMA 204**  
*Cập nhật lần cuối: 12/2024*

---

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Các vai trò (Roles)](#các-vai-trò-roles)
3. [Ma trận phân quyền](#ma-trận-phân-quyền)
4. [Cấu trúc hệ thống](#cấu-trúc-hệ-thống)
5. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dẫn)
6. [Bảo mật](#bảo-mật)

---

## 🎯 TỔNG QUAN

Hệ thống sử dụng mô hình **Role-Based Access Control (RBAC)** với 5 cấp độ phân quyền theo cấu trúc phân cấp (hierarchy). Mỗi vai trò có quyền hạn khác nhau và được kiểm soát chặt chẽ ở cả frontend và backend.

### Nguyên tắc thiết kế:
- **Phân cấp rõ ràng**: Vai trò cao hơn kế thừa quyền của vai trò thấp hơn
- **Kiểm tra đa lớp**: Validation ở middleware, layout, page và API
- **Tách biệt dữ liệu**: System Admin xem toàn bộ, các role khác chỉ xem dữ liệu công ty mình
- **Audit trail**: Tất cả thao tác quan trọng được ghi log

---

## 👥 CÁC VAI TRÒ (ROLES)

### 1. 🔴 System Admin (`system_admin`)

**Mô tả**: Quản trị viên hệ thống - Quyền cao nhất, không thuộc công ty nào

**Đặc điểm**:
- `company_id = NULL` trong database
- Xem được tất cả dữ liệu của tất cả công ty
- Có thể tạo/sửa/xóa công ty
- Quản lý tất cả người dùng trong hệ thống
- Truy cập System Logs
- Badge màu đỏ đậm trong UI

**Quyền hạn**:
\`\`\`
✅ Tất cả quyền của Admin
✅ Quản lý tất cả công ty trong hệ thống
✅ Xem và quản lý users của tất cả công ty
✅ Truy cập System Logs
✅ Xem Dashboard thống kê toàn hệ thống
✅ Cấu hình hệ thống
\`\`\`

**Use cases**:
- Nhà phát triển / vận hành hệ thống
- Quản lý nhiều công ty khách hàng
- Troubleshooting và hỗ trợ kỹ thuật

---

### 2. 🟠 Admin (`admin`)

**Mô tả**: Quản trị viên công ty - Quản lý toàn bộ một công ty

**Đặc điểm**:
- Thuộc về một `company_id` cụ thể
- Chỉ xem/quản lý dữ liệu công ty mình
- Quản lý users trong công ty
- Badge màu cam trong UI

**Quyền hạn**:
\`\`\`
✅ Tất cả quyền của Manager
✅ Quản lý thông tin công ty của mình
✅ Tạo/sửa/xóa users trong công ty
✅ Xem Dashboard công ty
✅ Quản lý cài đặt công ty
❌ Không xem được dữ liệu công ty khác
❌ Không truy cập System Logs
\`\`\`

**Use cases**:
- Giám đốc / Chủ doanh nghiệp
- IT Manager của công ty
- Người phụ trách quản lý toàn bộ hoạt động

---

### 3. 🟡 Manager (`manager`)

**Mô tả**: Quản lý - Quản lý cơ sở sản xuất và sản phẩm

**Đặc điểm**:
- Thuộc về một `company_id` cụ thể
- Quản lý facilities, products
- Tạo và chỉnh sửa dữ liệu
- Badge màu vàng trong UI

**Quyền hạn**:
\`\`\`
✅ Tất cả quyền của Operator
✅ Tạo/sửa/xóa Facilities (cơ sở)
✅ Tạo/sửa/xóa Products (sản phẩm)
✅ Xem báo cáo và thống kê
✅ Quản lý Lots và CTEs
❌ Không quản lý users
❌ Không sửa thông tin công ty
\`\`\`

**Use cases**:
- Trưởng phòng sản xuất
- Quản lý kho
- Người phụ trách một bộ phận cụ thể

---

### 4. 🔵 Operator (`operator`)

**Mô tả**: Nhân viên vận hành - Nhập liệu hàng ngày

**Đặc điểm**:
- Thuộc về một `company_id` cụ thể
- Nhập dữ liệu hàng ngày (Lots, CTEs, shipments)
- Không tạo facilities/products mới
- Badge màu xanh dương trong UI

**Quyền hạn**:
\`\`\`
✅ Tất cả quyền của Viewer
✅ Tạo/sửa Lots (lô hàng)
✅ Tạo/sửa CTEs (Critical Tracking Events)
✅ Tạo/sửa Shipments (vận chuyển)
✅ Tạo/sửa TLCs (Traceability Lot Codes)
❌ Không tạo facilities/products
❌ Không xem báo cáo tổng quan
\`\`\`

**Use cases**:
- Nhân viên nhập kho
- Nhân viên sản xuất
- Nhân viên vận chuyển

---

### 5. 🟢 Viewer (`viewer`)

**Mô tả**: Người xem - Chỉ xem dữ liệu, không chỉnh sửa

**Đặc điểm**:
- Thuộc về một `company_id` cụ thể
- Read-only access
- Xem dữ liệu công ty mình
- Badge màu xanh lá trong UI

**Quyền hạn**:
\`\`\`
✅ Xem thông tin công ty
✅ Xem danh sách facilities
✅ Xem danh sách products
✅ Xem Lots và CTEs
✅ Xem TLCs
✅ Tìm kiếm và truy xuất nguồn gốc
❌ Không tạo/sửa/xóa bất kỳ dữ liệu nào
\`\`\`

**Use cases**:
- Khách hàng/đối tác xem dữ liệu
- Nhân viên kiểm toán
- Người giám sát

---

## 📊 MA TRẬN PHÂN QUYỀN

### Phân quyền theo Module

| Chức năng | System Admin | Admin | Manager | Operator | Viewer |
|-----------|:------------:|:-----:|:-------:|:--------:|:------:|
| **Dashboard** |
| Xem Dashboard hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem Dashboard công ty | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Quản lý Công ty** |
| Xem tất cả công ty | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem công ty của mình | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo công ty mới | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sửa công ty | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xóa công ty | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Quản lý Users** |
| Xem tất cả users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem users trong công ty | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo user mới | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sửa user | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xóa user | ✅ | ✅ | ❌ | ❌ | ❌ |
| Thay đổi role | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Quản lý Facilities** |
| Xem facilities | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo facility | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sửa facility | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xóa facility | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Quản lý Products** |
| Xem products | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo product | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sửa product | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xóa product | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Quản lý Lots** |
| Xem lots | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo lot | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sửa lot | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xóa lot | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Quản lý CTEs** |
| Xem CTEs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo CTE | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sửa CTE | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xóa CTE | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Quản lý TLCs** |
| Xem TLCs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo TLC | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sửa TLC | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xóa TLC | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Quản lý Shipments** |
| Xem shipments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo shipment | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sửa shipment | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xóa shipment | ✅ | ✅ | ✅ | ✅ | ❌ |
| **System** |
| Xem System Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Truy cập Admin Panel | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cấu hình hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ |

### Phân quyền theo Route

| Route | System Admin | Admin | Manager | Operator | Viewer |
|-------|:------------:|:-----:|:-------:|:--------:|:------:|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/auth/*` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/company` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/facilities` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/products` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/lots` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/ctes` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/tlcs` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/shipments` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/admin` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/admin/users` | ✅ | ✅* | ❌ | ❌ | ❌ |
| `/admin/companies` | ✅ | ✅* | ❌ | ❌ | ❌ |
| `/admin/system-logs` | ✅ | ❌ | ❌ | ❌ | ❌ |

*Admin chỉ xem dữ liệu công ty mình, System Admin xem tất cả

---

## 🏗️ CẤU TRÚC HỆ THỐNG

### File Structure

\`\`\`
├── lib/
│   └── auth/
│       ├── roles.ts              # Định nghĩa roles và hierarchy
│       └── permissions.ts        # Permission checking utilities
├── app/
│   ├── proxy.ts                  # Middleware kiểm tra auth
│   ├── admin/
│   │   ├── layout.tsx            # Admin layout với role check
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── users/
│   │   │   └── page.tsx          # User management
│   │   ├── companies/
│   │   │   └── page.tsx          # Company management
│   │   └── system-logs/
│   │       └── page.tsx          # System logs (system_admin only)
│   └── dashboard/
│       ├── layout.tsx            # Main dashboard layout
│       └── company/
│           └── page.tsx          # Company info with edit permissions
└── components/
    ├── admin-nav.tsx             # Admin navigation với role badges
    └── dashboard-nav.tsx         # Main navigation với conditional admin link
\`\`\`

### Key Components

#### 1. `lib/auth/roles.ts`
Định nghĩa roles, hierarchy và các helper functions:
\`\`\`typescript
export enum UserRole {
  SYSTEM_ADMIN = "system_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  OPERATOR = "operator",
  VIEWER = "viewer",
}

// Check functions
hasMinimumRole(userRole, requiredRole)
hasRole(userRole, role)
hasAnyRole(userRole, roles)
isSystemAdmin(userRole)
canAccessAdminPanel(userRole)
canManageUsers(userRole)
canManageAllCompanies(userRole)
canManageOwnCompany(userRole)
canManageFacilities(userRole)
canManageProducts(userRole)
canManageLots(userRole)
getRoleDisplayName(role, language)
\`\`\`

#### 2. `lib/auth/permissions.ts`
Server và client-side permission utilities:
\`\`\`typescript
// Server-side
await requireAdminAccess()          // Throw error if not admin/system_admin
await requireSystemAdmin()          // Throw error if not system_admin

// Client-side
await checkClientAdminAccess()      // Return null if not authorized

// Permission checks
canManageUser(currentRole, currentCompanyId, targetCompanyId)
canAccessCompany(userRole, userCompanyId, targetCompanyId)
\`\`\`

#### 3. Middleware (`proxy.ts`)
Kiểm tra authentication và redirect:
\`\`\`typescript
// Public routes: /, /auth/*
// Protected routes: /dashboard/*, /admin/*
// Admin routes: Require admin or system_admin role
\`\`\`

#### 4. Admin Layout
Kiểm tra quyền truy cập admin panel:
\`\`\`typescript
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from("profiles")
  .select("role, company_id")
  .eq("id", user.id)
  .single()

if (!profile || !canAccessAdminPanel(profile.role)) {
  redirect("/dashboard")
}
\`\`\`

---

## 📖 HƯỚNG DẪN SỬ DỤNG

### Kiểm tra quyền trong Server Component

\`\`\`typescript
import { canAccessAdminPanel, isSystemAdmin } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/server"

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/signin")
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single()
  
  // Check admin access
  if (!canAccessAdminPanel(profile.role)) {
    redirect("/dashboard")
  }
  
  // Check system admin for specific features
  const canViewAllCompanies = isSystemAdmin(profile.role)
  
  // Fetch data based on role
  let query = supabase.from("companies").select("*")
  
  if (!isSystemAdmin(profile.role)) {
    // Regular admin can only see their company
    query = query.eq("id", profile.company_id)
  }
  
  const { data: companies } = await query
  
  return <div>{/* Your content */}</div>
}
\`\`\`

### Kiểm tra quyền trong Client Component

\`\`\`typescript
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { canManageFacilities } from "@/lib/auth/roles"

export function MyClientComponent() {
  const [canEdit, setCanEdit] = useState(false)
  const supabase = createClient()
  
  useEffect(() => {
    async function checkPermission() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      if (profile) {
        setCanEdit(canManageFacilities(profile.role))
      }
    }
    
    checkPermission()
  }, [])
  
  return (
    <div>
      {canEdit ? (
        <button>Edit Facility</button>
      ) : (
        <span>View Only</span>
      )}
    </div>
  )
}
\`\`\`

### Kiểm tra quyền trong Server Action

\`\`\`typescript
"use server"

import { requireAdminAccess, requireSystemAdmin } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"

export async function updateCompany(companyId: string, data: any) {
  // Check admin access
  const { profile } = await requireAdminAccess()
  
  const supabase = await createClient()
  
  // System admin can update any company
  // Regular admin can only update their own company
  if (!isSystemAdmin(profile.role) && profile.company_id !== companyId) {
    throw new Error("You can only update your own company")
  }
  
  const { data: updated, error } = await supabase
    .from("companies")
    .update(data)
    .eq("id", companyId)
    .select()
    .single()
  
  if (error) throw error
  
  return updated
}

export async function deleteCompany(companyId: string) {
  // Only system admin can delete companies
  await requireSystemAdmin()
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
  
  if (error) throw error
  
  return { success: true }
}
\`\`\`

### Hiển thị UI theo Role

\`\`\`typescript
import { getRoleDisplayName } from "@/lib/auth/roles"

function UserBadge({ role }: { role: string }) {
  const roleColors = {
    system_admin: "bg-red-500 text-white",
    admin: "bg-orange-500 text-white",
    manager: "bg-yellow-500 text-black",
    operator: "bg-blue-500 text-white",
    viewer: "bg-green-500 text-white",
  }
  
  return (
    <span className={`px-2 py-1 rounded text-xs ${roleColors[role] || "bg-gray-500"}`}>
      {getRoleDisplayName(role, "vi")}
    </span>
  )
}
\`\`\`

### Navigation với Role-based links

\`\`\`typescript
import { canAccessAdminPanel } from "@/lib/auth/roles"

export function Navigation({ userRole }: { userRole: string }) {
  const showAdminLink = canAccessAdminPanel(userRole)
  
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      {showAdminLink && (
        <a href="/admin">Admin Panel</a>
      )}
    </nav>
  )
}
\`\`\`

---

## 🔒 BẢO MẬT

### Nguyên tắc bảo mật

1. **Defense in Depth**: Kiểm tra quyền ở nhiều lớp
   - Middleware: Chặn truy cập routes không hợp lệ
   - Layout: Kiểm tra role trước khi render page
   - Page: Kiểm tra lại quyền và filter data
   - Server Action: Validate quyền trước khi thực hiện action

2. **Least Privilege**: Mỗi role chỉ có quyền tối thiểu cần thiết

3. **Data Isolation**: Filter dữ liệu theo company_id
   \`\`\`typescript
   // System admin sees all
   if (isSystemAdmin(profile.role)) {
     query = supabase.from("users").select("*")
   } else {
     // Regular admin only sees their company
     query = supabase
       .from("users")
       .select("*")
       .eq("company_id", profile.company_id)
   }
   \`\`\`

4. **Row Level Security (RLS)**: Sử dụng Supabase RLS policies
   \`\`\`sql
   -- Users can only see data from their company
   CREATE POLICY "Users can view own company data"
   ON facilities FOR SELECT
   USING (
     company_id IN (
       SELECT company_id FROM profiles WHERE id = auth.uid()
     )
     OR
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() 
       AND role = 'system_admin'
     )
   );
   \`\`\`

5. **Audit Logging**: Log tất cả thao tác quan trọng
   - User creation/deletion
   - Role changes
   - Company modifications
   - Critical data changes

### Checklist bảo mật khi thêm feature mới

- [ ] Kiểm tra authentication trong middleware
- [ ] Kiểm tra role trong layout/page
- [ ] Filter dữ liệu theo company_id
- [ ] Validate input
- [ ] Kiểm tra ownership (user có quyền với resource này không?)
- [ ] Log audit trail
- [ ] Test với tất cả roles
- [ ] Test edge cases (null company_id, invalid role, etc.)

---

## 🧪 TESTING

### Test Cases cho từng Role

\`\`\`typescript
describe("Permission System", () => {
  test("system_admin can access all companies", async () => {
    const profile = { role: "system_admin", company_id: null }
    const companies = await fetchCompanies(profile)
    expect(companies.length).toBeGreaterThan(1)
  })
  
  test("admin can only access own company", async () => {
    const profile = { role: "admin", company_id: "company-1" }
    const companies = await fetchCompanies(profile)
    expect(companies.length).toBe(1)
    expect(companies[0].id).toBe("company-1")
  })
  
  test("manager cannot access admin panel", async () => {
    const profile = { role: "manager", company_id: "company-1" }
    expect(canAccessAdminPanel(profile.role)).toBe(false)
  })
  
  test("viewer cannot create facilities", async () => {
    const profile = { role: "viewer", company_id: "company-1" }
    expect(canManageFacilities(profile.role)).toBe(false)
  })
})
\`\`\`

---

## 📝 CHANGELOG

### Version 1.1 (12/2024)
- Thêm role `system_admin` tách biệt với `admin`
- Tạo file `lib/auth/permissions.ts` với utilities
- Cập nhật tất cả admin pages với role check
- Thêm middleware protection cho admin routes
- Cập nhật UI với role badges và warnings

### Version 1.0 (Initial)
- 4 roles cơ bản: admin, manager, operator, viewer
- Basic permission checks

---

## 🤝 HỖ TRỢ

Nếu có thắc mắc về phân quyền hoặc gặp lỗi liên quan đến permissions, vui lòng:
1. Kiểm tra role trong database: `SELECT role, company_id FROM profiles WHERE id = '<user-id>'`
2. Kiểm tra console logs để xem role detection
3. Xem lại tài liệu này để đảm bảo đang dùng đúng helper functions
4. Liên hệ team để được hỗ trợ

---

**Cập nhật bởi**: v0 AI Assistant  
**Ngày cập nhật**: 12/22/2024
