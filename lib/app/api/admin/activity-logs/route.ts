import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["system_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateFilter = searchParams.get("dateFilter") || "7days"
    const action = searchParams.get("action")
    const severity = searchParams.get("severity")

    const serviceClient = createServiceRoleClient()

    const now = new Date()
    const dateLimit = new Date()
    switch (dateFilter) {
      case "24hours":
        dateLimit.setHours(now.getHours() - 24)
        break
      case "7days":
        dateLimit.setDate(now.getDate() - 7)
        break
      case "30days":
        dateLimit.setDate(now.getDate() - 30)
        break
      case "all":
        dateLimit.setFullYear(2000)
        break
    }

    let query = serviceClient
      .from("system_logs")
      .select("*, profiles!system_logs_user_id_fkey(full_name, role, company_id)")
      .in("action", [
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
      ])
      .gte("created_at", dateLimit.toISOString())
      .order("created_at", { ascending: false })
      .limit(200)

    if (action && action !== "all") {
      query = query.eq("action", action)
    }

    if (severity && severity !== "all") {
      query = query.contains("metadata", { severity })
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error("[v0] Error fetching activity logs:", logsError)
      return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
    }

    const stats = {
      totalActions: logs?.length || 0,
      criticalActions:
        logs?.filter((log) => log.metadata?.severity === "critical" || log.action.includes("delete")).length || 0,
      userChanges:
        logs?.filter((log) => log.action.startsWith("user_") || log.action.includes("role_change")).length || 0,
      todayActions:
        logs?.filter((log) => new Date(log.created_at).toDateString() === new Date().toDateString()).length || 0,
    }

    return NextResponse.json({ logs: logs || [], stats })
  } catch (error: any) {
    console.error("[v0] Activity logs API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
