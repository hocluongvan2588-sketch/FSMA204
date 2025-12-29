import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/simple-auth"

export type AdminAction =
  | "user_create"
  | "user_update"
  | "user_delete"
  | "user_role_change"
  | "company_create"
  | "company_update"
  | "company_delete"
  | "facility_approve"
  | "facility_reject"
  | "subscription_change"
  | "quota_override"
  | "2fa_enrolled"
  | "2fa_unenrolled"
  | "2fa_verified"
  | "2fa_failed"
  | "admin_login"
  | "admin_logout"
  | "sensitive_data_access"

export interface AdminAuditLog {
  action: AdminAction
  targetUserId?: string
  targetCompanyId?: string
  targetEntityId?: string
  entityType?: string
  description: string
  metadata?: Record<string, any>
  changes?: {
    before: Record<string, any>
    after: Record<string, any>
  }
  ipAddress?: string
  userAgent?: string
  severity?: "low" | "medium" | "high" | "critical"
}

export async function logAdminAction(data: AdminAuditLog): Promise<void> {
  try {
    const session = await getSession()

    if (!session?.id) {
      console.error("[v0] Cannot log admin action: No authenticated user")
      return
    }

    // Get user profile for additional context
    const profile = await prisma.profiles.findUnique({
      where: { profile_id: session.id },
      select: { role: true, company_id: true, full_name: true },
    })

    if (!profile || !["system_admin", "admin"].includes(profile.role)) {
      console.error("[v0] Cannot log admin action: User is not an admin")
      return
    }

    // Log to system_logs table
    await prisma.system_logs.create({
      data: {
        user_id: session.id,
        action: data.action,
        entity_type: data.entityType || "admin_action",
        entity_id: data.targetEntityId || data.targetUserId || data.targetCompanyId || null,
        description: data.description,
        metadata: {
          ...data.metadata,
          admin_role: profile.role,
          admin_name: profile.full_name,
          admin_company_id: profile.company_id,
          target_user_id: data.targetUserId,
          target_company_id: data.targetCompanyId,
          changes: data.changes,
          severity: data.severity || "medium",
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
        } as any,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      },
    })

    // Log critical actions separately for enhanced monitoring
    if (data.severity === "critical" || data.action.includes("delete") || data.action.includes("role_change")) {
      console.log("[v0] CRITICAL ADMIN ACTION:", {
        action: data.action,
        admin: profile.full_name,
        role: profile.role,
        description: data.description,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("[v0] Failed to log admin action:", error)
    // Continue execution even if logging fails - don't break the main flow
  }
}

export async function getAdminAuditLogs(filters?: {
  action?: AdminAction
  userId?: string
  adminId?: string
  companyId?: string
  dateFrom?: string
  dateTo?: string
  severity?: string
  limit?: number
}) {
  try {
    const where: any = {
      action: {
        in: [
          "user_create",
          "user_update",
          "user_delete",
          "user_role_change",
          "company_create",
          "company_update",
          "company_delete",
          "facility_approve",
          "facility_reject",
          "subscription_change",
          "quota_override",
          "2fa_enrolled",
          "2fa_unenrolled",
          "2fa_verified",
          "2fa_failed",
          "admin_login",
          "admin_logout",
          "sensitive_data_access",
        ],
      },
    }

    if (filters?.action) {
      where.action = filters.action
    }

    if (filters?.adminId) {
      where.user_id = filters.adminId
    }

    if (filters?.dateFrom) {
      where.created_at = { ...where.created_at, gte: new Date(filters.dateFrom) }
    }

    if (filters?.dateTo) {
      where.created_at = { ...where.created_at, lte: new Date(filters.dateTo) }
    }

    const data = await prisma.system_logs.findMany({
      where,
      include: {
        profiles: {
          select: {
            full_name: true,
            role: true,
            company_id: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: filters?.limit || 100,
    })

    return data
  } catch (error) {
    console.error("[v0] Failed to fetch admin audit logs:", error)
    return []
  }
}
