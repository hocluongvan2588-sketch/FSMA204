import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

    if (!profile || (profile.role !== "admin" && profile.role !== "system_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const isSystemAdmin = profile.role === "system_admin"
    const serviceClient = createServiceRoleClient()

    // Security Health Status
    const { data: allProfiles } = await serviceClient
      .from("profiles")
      .select("id, role, app_metadata")
      .in("role", ["system_admin", "admin"])

    const systemAdminsWithMFA =
      allProfiles?.filter((p) => p.role === "system_admin" && (p.app_metadata as any)?.mfa_enabled === true).length || 0

    const totalSystemAdmins = allProfiles?.filter((p) => p.role === "system_admin").length || 0
    const systemAdminsWithoutMFA = totalSystemAdmins - systemAdminsWithMFA

    // Failed login attempts (last 24h)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: failedLogins } = await serviceClient
      .from("system_logs")
      .select("id")
      .eq("action", "login_failed")
      .gte("created_at", oneDayAgo.toISOString())

    // Critical actions in last 24h
    const { data: criticalActions } = await serviceClient
      .from("system_logs")
      .select("id")
      .in("severity", ["high", "critical"])
      .gte("created_at", oneDayAgo.toISOString())

    // Pending facility update requests
    const { data: pendingRequests } = await serviceClient
      .from("facility_update_requests")
      .select("id")
      .eq("status", "pending")

    // FDA Compliance Status
    const { data: facilities } = await serviceClient
      .from("facilities")
      .select("id, fda_registration_number, fda_registration_date")

    const fdaRegistered = facilities?.filter((f) => f.fda_registration_number).length || 0
    const totalFacilities = facilities?.length || 0

    // Expiring FDA registrations (within 60 days)
    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

    const expiringRegistrations =
      facilities?.filter((f) => {
        if (!f.fda_registration_date) return false
        const registrationDate = new Date(f.fda_registration_date)
        registrationDate.setFullYear(registrationDate.getFullYear() + 1) // FDA expires after 1 year
        return registrationDate <= sixtyDaysFromNow && registrationDate > new Date()
      }).length || 0

    // US Agents status
    const { data: usAgents } = await serviceClient.from("us_agents").select("id, valid_until")

    const activeUSAgents =
      usAgents?.filter((a) => {
        return a.valid_until ? new Date(a.valid_until) > new Date() : true
      }).length || 0

    const expiringUSAgents =
      usAgents?.filter((a) => {
        if (!a.valid_until) return false
        const validUntil = new Date(a.valid_until)
        return validUntil <= sixtyDaysFromNow && validUntil > new Date()
      }).length || 0

    // Service & Subscription Metrics
    const { data: subscriptions } = await serviceClient
      .from("company_subscriptions")
      .select("id, subscription_status, subscription_end_date")

    const activeSubscriptions = subscriptions?.filter((s) => s.subscription_status === "active").length || 0

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringSubscriptions =
      subscriptions?.filter((s) => {
        if (!s.subscription_end_date) return false
        const endDate = new Date(s.subscription_end_date)
        return endDate <= thirtyDaysFromNow && endDate > new Date()
      }).length || 0

    // Recent critical events (last 5)
    const { data: recentCriticalEvents } = await serviceClient
      .from("system_logs")
      .select("id, action, description, created_at, severity, user_id, profiles(full_name)")
      .in("severity", ["high", "critical"])
      .order("created_at", { ascending: false })
      .limit(5)

    // Active sessions count (approximate - users logged in last 24h)
    const { data: recentActivity } = await serviceClient
      .from("system_logs")
      .select("user_id")
      .gte("created_at", oneDayAgo.toISOString())

    const uniqueActiveSessions = new Set(recentActivity?.map((a) => a.user_id) || []).size

    // Last admin actions (top 5 recent)
    const { data: lastAdminActions } = await serviceClient
      .from("system_logs")
      .select("id, action, description, created_at, user_id, profiles(full_name, role)")
      .in("action_category", ["user_management", "company_management", "facility_management"])
      .order("created_at", { ascending: false })
      .limit(5)

    // Compliance rate
    const complianceRate = totalFacilities > 0 ? Math.round((fdaRegistered / totalFacilities) * 100) : 0

    return NextResponse.json({
      security: {
        systemAdminsWithMFA,
        systemAdminsWithoutMFA,
        totalSystemAdmins,
        failedLoginsLast24h: failedLogins?.length || 0,
        mfaComplianceRate: totalSystemAdmins > 0 ? Math.round((systemAdminsWithMFA / totalSystemAdmins) * 100) : 0,
      },
      activity: {
        criticalActionsLast24h: criticalActions?.length || 0,
        pendingApprovals: pendingRequests?.length || 0,
        activeSessions: uniqueActiveSessions,
        lastAdminActions: lastAdminActions || [],
      },
      compliance: {
        fdaRegistered,
        totalFacilities,
        complianceRate,
        expiringRegistrations,
        activeUSAgents,
        expiringUSAgents,
      },
      subscriptions: {
        active: activeSubscriptions,
        expiringSoon: expiringSubscriptions,
        total: subscriptions?.length || 0,
      },
      criticalEvents: recentCriticalEvents || [],
    })
  } catch (error: any) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
