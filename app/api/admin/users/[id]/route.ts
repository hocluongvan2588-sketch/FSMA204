import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's profile to check role and company
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 })
    }

    const isSystemAdmin = currentProfile.role === "system_admin"
    const isAdmin = currentProfile.role === "admin"

    if (!isSystemAdmin && !isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const adminClient = createServiceRoleClient()

    // Fetch the target user's profile
    const { data: profile, error: userError } = await adminClient.from("profiles").select("*").eq("id", userId).single()

    if (userError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!isSystemAdmin && profile.company_id !== currentProfile.company_id) {
      return NextResponse.json({ error: "Cannot access users from other companies" }, { status: 403 })
    }

    const { data: authData, error: authDataError } = await adminClient.auth.admin.getUserById(userId)

    let email = "N/A"
    let lastSignIn = null
    if (authData && authData.user) {
      email = authData.user.email || "N/A"
      lastSignIn = authData.user.last_sign_in_at
    }

    return NextResponse.json({
      profile,
      auth: {
        email,
        last_sign_in_at: lastSignIn,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching user details:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const body = await request.json()

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's profile to check role and company
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 })
    }

    const isSystemAdmin = currentProfile.role === "system_admin"
    const isAdmin = currentProfile.role === "admin"

    if (!isSystemAdmin && !isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const adminClient = createServiceRoleClient()

    // Get target user to check authorization
    const { data: targetUser, error: targetError } = await adminClient
      .from("profiles")
      .select("company_id, role")
      .eq("id", userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Authorization check: Company admin can only update users in their company
    if (!isSystemAdmin && targetUser.company_id !== currentProfile.company_id) {
      return NextResponse.json({ error: "Cannot update users from other companies" }, { status: 403 })
    }

    // Prevent non-system admins from creating/modifying system admins or other admins
    if (!isSystemAdmin && (body.role === "system_admin" || body.role === "admin")) {
      return NextResponse.json({ error: "Cannot assign admin or system admin role" }, { status: 403 })
    }

    // Prevent non-system admins from modifying admins
    if (!isSystemAdmin && (targetUser.role === "admin" || targetUser.role === "system_admin")) {
      return NextResponse.json({ error: "Cannot modify admin users" }, { status: 403 })
    }

    // Update profile
    const updates = {
      full_name: body.full_name,
      role: body.role,
      phone: body.phone,
      company_id: body.company_id,
      language_preference: body.language_preference,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await adminClient.from("profiles").update(updates).eq("id", userId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
