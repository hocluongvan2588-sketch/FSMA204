import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Missing userId or newPassword" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

    if (!profile || !["admin", "system_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (profile.role !== "system_admin") {
      // Non-system admin can only change passwords for users in their company
      const { data: targetProfile } = await supabase.from("profiles").select("company_id").eq("id", userId).single()

      if (!targetProfile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      if (targetProfile.company_id !== profile.company_id) {
        return NextResponse.json(
          { error: "Forbidden - Cannot change password for users outside your company" },
          { status: 403 },
        )
      }
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error("[v0] Password update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
