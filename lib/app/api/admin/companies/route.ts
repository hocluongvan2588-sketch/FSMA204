import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logAdminAction } from "@/lib/utils/admin-audit-logger"

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

export async function POST(request: Request) {
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

    if (!profile || profile.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - System Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, address, registration_number } = body

    if (!name || !registration_number) {
      return NextResponse.json({ error: "Name and registration number are required" }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()
    const { data: company, error } = await serviceClient
      .from("companies")
      .insert({
        name,
        email: email || "",
        phone: phone || "N/A",
        address: address || "Default Address",
        registration_number,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating company:", error)
      return NextResponse.json({ error: error.message || "Failed to create company" }, { status: 500 })
    }

    await logAdminAction({
      action: "company_create",
      targetCompanyId: company.id,
      description: `Created new company: ${name} (${registration_number})`,
      metadata: {
        company_name: name,
        company_email: email,
        company_phone: phone,
        registration_number,
        company_address: address,
      },
      severity: "high",
    })

    return NextResponse.json(company)
  } catch (error: any) {
    console.error("[v0] Company creation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
