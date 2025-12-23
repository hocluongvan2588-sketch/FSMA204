import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile lookup failed:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.role !== "admin" && profile.role !== "system_admin") {
      console.error("[v0] Unauthorized access attempt by user:", user.id, "role:", profile.role)
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const isSystemAdmin = profile.role === "system_admin"
    const companyId = profile.company_id

    console.log("[v0] Stats API called by:", user.email, "role:", profile.role, "companyId:", companyId)

    // Use service role client to bypass RLS and get accurate statistics
    const serviceClient = createServiceRoleClient()

    let usersQuery = serviceClient.from("profiles").select("id", { count: "exact", head: true })
    let facilitiesQuery = serviceClient.from("facilities").select("id", { count: "exact", head: true })
    let systemLogsQuery = serviceClient.from("system_logs").select("id", { count: "exact", head: true })
    let companyAdminsQuery = serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if (!isSystemAdmin) {
      if (!companyId) {
        console.log("[v0] Admin has no company_id, returning zero stats")
        return NextResponse.json({
          stats: {
            totalUsers: 0,
            totalCompanies: 0,
            totalFacilities: 0,
            systemAdmins: 0,
            companyAdmins: 0,
            activeUsers: 0,
            totalSystemLogs: 0,
          },
          recentUsers: [],
        })
      }

      console.log("[v0] Filtering stats for company:", companyId)
      usersQuery = usersQuery.eq("company_id", companyId)
      facilitiesQuery = facilitiesQuery.eq("company_id", companyId)
      systemLogsQuery = systemLogsQuery.or(`user_id.eq.${user.id},company_id.eq.${companyId}`)
      companyAdminsQuery = companyAdminsQuery.eq("company_id", companyId)
    }

    const [usersData, companiesData, facilitiesData, systemAdminsData, companyAdminsData, systemLogsData] =
      await Promise.all([
        usersQuery,
        isSystemAdmin
          ? serviceClient.from("companies").select("id", { count: "exact", head: true })
          : Promise.resolve({ count: companyId ? 1 : 0 }),
        facilitiesQuery,
        isSystemAdmin
          ? serviceClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "system_admin")
          : Promise.resolve({ count: 0 }),
        companyAdminsQuery,
        systemLogsQuery,
      ])

    const stats = {
      totalUsers: usersData.count || 0,
      totalCompanies: companiesData.count || 0,
      totalFacilities: facilitiesData.count || 0,
      systemAdmins: systemAdminsData.count || 0,
      companyAdmins: companyAdminsData.count || 0,
      activeUsers: usersData.count || 0,
      totalSystemLogs: systemLogsData.count || 0,
    }

    console.log("[v0] Stats returned:", stats)

    // Load recent users
    let recentUsersQuery = serviceClient
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        role,
        created_at,
        company_id,
        companies (name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(5)

    if (!isSystemAdmin && companyId) {
      recentUsersQuery = recentUsersQuery.eq("company_id", companyId)
    }

    const { data: recentUsers } = await recentUsersQuery

    console.log("[v0] Recent users count:", recentUsers?.length || 0)

    return NextResponse.json({ stats, recentUsers: recentUsers || [] })
  } catch (error: any) {
    console.error("[v0] Admin stats error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
