// Role hierarchy and permissions system

export enum UserRole {
  SYSTEM_ADMIN = "system_admin", // Super admin - không thuộc công ty nào, quản trị toàn hệ thống
  ADMIN = "admin", // Admin công ty - quản lý công ty riêng
  MANAGER = "manager", // Quản lý cơ sở, sản phẩm
  OPERATOR = "operator", // Nhập liệu hàng ngày
  VIEWER = "viewer", // Chỉ xem
}

// Hierarchy levels (higher = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SYSTEM_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.OPERATOR]: 2,
  [UserRole.VIEWER]: 1,
}

// Check if user has minimum required role
export function hasMinimumRole(userRole: string, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole]
  return userLevel >= requiredLevel
}

// Check if user has specific role
export function hasRole(userRole: string, role: UserRole): boolean {
  return userRole === role
}

// Check if user has any of the specified roles
export function hasAnyRole(userRole: string, roles: UserRole[]): boolean {
  return roles.includes(userRole as UserRole)
}

// Check if user is system admin (can access all data across companies)
export function isSystemAdmin(userRole: string): boolean {
  return userRole === UserRole.SYSTEM_ADMIN
}

// Check if user can access admin panel
export function canAccessAdminPanel(userRole: string): boolean {
  return hasAnyRole(userRole, [UserRole.SYSTEM_ADMIN, UserRole.ADMIN])
}

// Check if user can manage users
export function canManageUsers(userRole: string): boolean {
  return hasAnyRole(userRole, [UserRole.SYSTEM_ADMIN, UserRole.ADMIN])
}

// Check if user can manage companies (only system admin)
export function canManageAllCompanies(userRole: string): boolean {
  return isSystemAdmin(userRole)
}

// Check if user can manage their company
export function canManageOwnCompany(userRole: string): boolean {
  return hasMinimumRole(userRole, UserRole.ADMIN)
}

// Check if user can create/edit facilities
export function canManageFacilities(userRole: string): boolean {
  return hasMinimumRole(userRole, UserRole.MANAGER)
}

// Check if user can create/edit products
export function canManageProducts(userRole: string): boolean {
  return hasMinimumRole(userRole, UserRole.MANAGER)
}

// Check if user can create/edit lots and CTEs
export function canManageLots(userRole: string): boolean {
  return hasMinimumRole(userRole, UserRole.OPERATOR)
}

// Get role display name
export function getRoleDisplayName(role: string, language: "vi" | "en" = "vi"): string {
  const names: Record<string, { vi: string; en: string }> = {
    [UserRole.SYSTEM_ADMIN]: { vi: "Quản trị hệ thống", en: "System Administrator" },
    [UserRole.ADMIN]: { vi: "Quản trị viên", en: "Administrator" },
    [UserRole.MANAGER]: { vi: "Quản lý", en: "Manager" },
    [UserRole.OPERATOR]: { vi: "Nhân viên", en: "Operator" },
    [UserRole.VIEWER]: { vi: "Người xem", en: "Viewer" },
  }
  return names[role]?.[language] || role
}
