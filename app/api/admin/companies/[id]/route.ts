import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { name, registration_number, email, phone, address } = body

    const { id } = await params

    const serviceClient = createServiceRoleClient()
    const { data: company, error } = await serviceClient
      .from("companies")
      .update({
        name,
        registration_number,
        email,
        phone,
        address,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating company:", error)
      return NextResponse.json({ error: error.message || "Failed to update company" }, { status: 500 })
    }

    return NextResponse.json(company)
  } catch (error: any) {
    console.error("[v0] Company update error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    const serviceClient = createServiceRoleClient()

    // Check if company has users
    const { count: usersCount } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", id)

    if (usersCount && usersCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete company with ${usersCount} user(s). Please remove users first.` },
        { status: 400 },
      )
    }

    // Check if company has facilities
    const { count: facilitiesCount } = await serviceClient
      .from("facilities")
      .select("id", { count: "exact", head: true })
      .eq("company_id", id)

    if (facilitiesCount && facilitiesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete company with ${facilitiesCount} facility(ies). Please remove facilities first.` },
        { status: 400 },
      )
    }

    // Delete subscriptions first
    await serviceClient.from("company_subscriptions").delete().eq("company_id", id)

    // Delete company
    const { error } = await serviceClient.from("companies").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting company:", error)
      return NextResponse.json({ error: error.message || "Failed to delete company" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Company deletion error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
