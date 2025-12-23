import { createClient } from "@/lib/supabase/server"

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "export"
  | "import"
  | "login"
  | "logout"
  | "approve"
  | "reject"

export type EntityType =
  | "product"
  | "facility"
  | "traceability_lot"
  | "shipment"
  | "audit_report"
  | "user"
  | "company"
  | "cte"
  | "fda_registration"
  | "agent"

export interface ActivityLogData {
  action: ActivityAction
  entityType: EntityType
  entityId?: string
  description?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] Cannot log activity: No authenticated user")
      return
    }

    await supabase.from("system_logs").insert({
      user_id: user.id,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      description: data.description || `${data.action} ${data.entityType}`,
      metadata: data.metadata || {},
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
    })
  } catch (error) {
    console.error("[v0] Failed to log activity:", error)
  }
}

export async function getActivityLogs(filters?: {
  entityType?: EntityType
  entityId?: string
  userId?: string
  action?: ActivityAction
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from("system_logs")
    .select("*, profiles(full_name, role)")
    .order("created_at", { ascending: false })

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType)
  }

  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId)
  }

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId)
  }

  if (filters?.action) {
    query = query.eq("action", filters.action)
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  } else {
    query = query.limit(100)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Failed to fetch activity logs:", error)
    return []
  }

  return data || []
}

export function getActionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    create: "Tạo mới",
    update: "Cập nhật",
    delete: "Xóa",
    view: "Xem",
    export: "Xuất dữ liệu",
    import: "Nhập dữ liệu",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    approve: "Phê duyệt",
    reject: "Từ chối",
  }
  return labels[action] || action
}

export function getEntityTypeLabel(entityType: EntityType): string {
  const labels: Record<EntityType, string> = {
    product: "Sản phẩm",
    facility: "Cơ sở",
    traceability_lot: "Lô hàng",
    shipment: "Vận chuyển",
    audit_report: "Báo cáo kiểm toán",
    user: "Người dùng",
    company: "Công ty",
    cte: "CTE",
    fda_registration: "Đăng ký FDA",
    agent: "Đại lý",
  }
  return labels[entityType] || entityType
}
