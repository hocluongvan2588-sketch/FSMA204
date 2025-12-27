import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
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

    const serviceClient = createServiceRoleClient()
    const { data: companies, error } = await serviceClient
      .from("companies")
      .select("id, name, display_name, created_at")
      .order("name")

    if (error) {
      console.error("[v0] Error fetching companies:", error)
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
    }

    return NextResponse.json(companies || [])
  } catch (error: any) {
    console.error("[v0] Companies API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
