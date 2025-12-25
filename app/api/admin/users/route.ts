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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id, organization_type")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.role !== "admin" && profile.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const isSystemAdmin = profile.role === "system_admin"

    const serviceClient = createServiceRoleClient()

    let profilesQuery = serviceClient
      .from("profiles")
      .select("id, full_name, role, phone, created_at, organization_type, allowed_cte_types, company_id")
      .order("created_at", { ascending: false })

    if (!isSystemAdmin) {
      if (!profile.company_id) {
        return NextResponse.json({ profiles: [], companies: [] })
      }
      profilesQuery = profilesQuery.eq("company_id", profile.company_id)
    }

    const { data: profiles } = await profilesQuery

    let companiesQuery = serviceClient.from("companies").select("id, name, display_name").order("name")

    if (!isSystemAdmin && profile.company_id) {
      companiesQuery = companiesQuery.eq("id", profile.company_id)
    }

    const { data: companies } = await companiesQuery

    return NextResponse.json({ profiles: profiles || [], companies: companies || [] })
  } catch (error: any) {
    console.error("[v0] Admin users API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
