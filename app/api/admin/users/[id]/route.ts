import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/simple-auth"
import { logAdminAction } from "@/lib/utils/admin-audit-logger"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params

    console.log("[v0] Fetching user details for ID:", userId)

    const session = await requireAuth(["admin", "system_admin"])

    console.log("[v0] Current user ID:", session.id)

    const isSystemAdmin = session.role === "system_admin"
    const isAdmin = session.role === "admin"

    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        id: true,
        company_id: true,
        full_name: true,
        role: true,
        phone: true,
        language_preference: true,
        created_at: true,
        updated_at: true,
        organization_type: true,
        allowed_cte_types: true,
        email: true,
        last_login_at: true,
      },
    })

    if (!profile) {
      console.error("[v0] User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User profile:", profile)

    if (!isSystemAdmin && profile.company_id && profile.company_id !== session.company_id) {
      console.error("[v0] Company mismatch. Target:", profile.company_id, "Current:", session.company_id)
      return NextResponse.json({ error: "Cannot access users from other companies" }, { status: 403 })
    }

    console.log("[v0] Returning user data with email:", profile.email)

    return NextResponse.json({
      profile: profile,
      auth: {
        email: profile.email,
        last_sign_in_at: profile.last_login_at,
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

    const session = await requireAuth(["admin", "system_admin"])

    const isSystemAdmin = session.role === "system_admin"

    const targetUser = await prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        company_id: true,
        role: true,
        organization_type: true,
        full_name: true,
        phone: true,
      },
    })

    if (!targetUser) {
      console.error("[v0] Target user profile is null for ID:", userId)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    console.log("[v0] Target user profile:", targetUser)

    // Authorization check: Company admin can only update users in their company
    if (!isSystemAdmin && targetUser.company_id && targetUser.company_id !== session.company_id) {
      console.error("[v0] Company mismatch. Target:", targetUser.company_id, "Current:", session.company_id)
      return NextResponse.json({ error: "Cannot update users from other companies" }, { status: 403 })
    }

    // Prevent non-system admins from creating/modifying system admins or other admins
    if (!isSystemAdmin && (body.role === "system_admin" || body.role === "admin")) {
      console.error("[v0] Attempting to assign admin or system admin role by non-system admin")
      return NextResponse.json({ error: "Cannot assign admin or system admin role" }, { status: 403 })
    }

    // Prevent non-system admins from modifying admins
    if (!isSystemAdmin && (targetUser.role === "admin" || targetUser.role === "system_admin")) {
      console.error("[v0] Attempting to modify admin user by non-system admin")
      return NextResponse.json({ error: "Cannot modify admin users" }, { status: 403 })
    }

    const beforeState = {
      full_name: targetUser.full_name,
      role: targetUser.role,
      phone: targetUser.phone,
      company_id: targetUser.company_id,
      organization_type: targetUser.organization_type,
    }

    const updates = {
      full_name: body.full_name,
      role: body.role,
      phone: body.phone,
      company_id: body.company_id,
      language_preference: body.language_preference,
      organization_type: body.organization_type,
      allowed_cte_types: body.allowed_cte_types,
      updated_at: new Date(),
    }

    await prisma.profiles.update({
      where: { id: userId },
      data: updates,
    })

    const roleChanged = beforeState.role !== body.role
    await logAdminAction({
      action: roleChanged ? "user_role_change" : "user_update",
      targetUserId: userId,
      targetCompanyId: body.company_id,
      description: roleChanged
        ? `Changed user role from ${beforeState.role} to ${body.role} for user: ${body.full_name}`
        : `Updated user profile for: ${body.full_name}`,
      changes: {
        before: beforeState,
        after: updates,
      },
      metadata: {
        updated_fields: Object.keys(body),
        role_changed: roleChanged,
        old_role: beforeState.role,
        new_role: body.role,
      },
      severity: roleChanged ? "high" : "medium",
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
