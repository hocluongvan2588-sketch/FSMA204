import { createClient } from "@/lib/supabase/server"

export interface AuditTrailEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: string
  entityType: string
  entityId?: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
}

export interface AuditTrailFilters {
  entityType?: string
  entityId?: string
  userId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}

export async function getAuditTrail(filters?: AuditTrailFilters): Promise<AuditTrailEntry[]> {
  const supabase = await createClient()

  let query = supabase
    .from("system_logs")
    .select(`
      id,
      created_at,
      user_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata,
      ip_address,
      profiles(full_name, role)
    `)
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

  query = query.limit(500)

  const { data, error } = await query

  if (error) {
    console.error("[v0] Failed to fetch audit trail:", error)
    return []
  }

  return (
    data?.map((entry: any) => ({
      id: entry.id,
      timestamp: entry.created_at,
      userId: entry.user_id,
      userName: entry.profiles?.full_name || "Unknown User",
      userRole: entry.profiles?.role || "unknown",
      action: entry.action,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      description: entry.description,
      metadata: entry.metadata,
      ipAddress: entry.ip_address,
    })) || []
  )
}

export async function exportAuditTrail(filters?: AuditTrailFilters): Promise<string> {
  const trail = await getAuditTrail(filters)

  const csv = [
    ["Timestamp", "User", "Role", "Action", "Entity Type", "Entity ID", "Description", "IP Address"].join(","),
    ...trail.map((entry) =>
      [
        new Date(entry.timestamp).toLocaleString("vi-VN"),
        entry.userName,
        entry.userRole,
        entry.action,
        entry.entityType,
        entry.entityId || "",
        `"${entry.description}"`,
        entry.ipAddress || "",
      ].join(","),
    ),
  ].join("\n")

  return csv
}
