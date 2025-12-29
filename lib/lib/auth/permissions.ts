// Comprehensive permission checking utilities for server and client components

import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { UserRole, canAccessAdminPanel } from "./roles"

/**
 * Server-side permission check for admin routes
 * Use in Server Components and Route Handlers
 */
export async function requireAdminAccess() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: No user found")
  }

  const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

  if (!profile || !canAccessAdminPanel(profile.role)) {
    throw new Error(`Unauthorized: Role '${profile?.role}' cannot access admin panel`)
  }

  return { user, profile }
}

/**
 * Server-side permission check for system admin only routes
 */
export async function requireSystemAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: No user found")
  }

  const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

  if (!profile || profile.role !== UserRole.SYSTEM_ADMIN) {
    throw new Error(`Unauthorized: System admin access required`)
  }

  return { user, profile }
}

/**
 * Client-side permission check
 * Returns null if not authorized, profile data if authorized
 */
export async function checkClientAdminAccess() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

  if (!profile || !canAccessAdminPanel(profile.role)) {
    return null
  }

  return profile
}

/**
 * Check if user can manage users
 * system_admin can manage all users, admin can manage users in their company
 */
export function canManageUser(
  currentUserRole: string,
  currentUserCompanyId: string | null,
  targetUserCompanyId: string | null,
): boolean {
  if (currentUserRole === UserRole.SYSTEM_ADMIN) {
    return true // System admin can manage all users
  }

  if (currentUserRole === UserRole.ADMIN) {
    // Admin can only manage users in their company
    return currentUserCompanyId === targetUserCompanyId
  }

  return false
}

/**
 * Check if user can view/edit company data
 */
export function canAccessCompany(userRole: string, userCompanyId: string | null, targetCompanyId: string): boolean {
  if (userRole === UserRole.SYSTEM_ADMIN) {
    return true // System admin can access all companies
  }

  return userCompanyId === targetCompanyId // Others can only access their own company
}
