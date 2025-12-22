import { NextResponse } from "next/server"
import { recalculateUsage } from "@/lib/quota"
import { createClient } from "@/lib/supabase/server"

/**
 * API endpoint to recalculate subscription usage counts
 * Useful for syncing counters if they get out of sync
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Only admins and system_admins can recalculate
    if (profile.role !== "admin" && profile.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Recalculate usage
    await recalculateUsage(profile.company_id)

    // Get updated subscription
    const { data: subscription } = await supabase
      .from("company_subscriptions")
      .select(
        `
        current_users_count,
        current_facilities_count,
        current_products_count,
        current_storage_gb,
        service_packages (
          max_users,
          max_facilities,
          max_products,
          max_storage_gb
        )
      `,
      )
      .eq("company_id", profile.company_id)
      .eq("subscription_status", "active")
      .single()

    return NextResponse.json({
      success: true,
      usage: subscription
        ? {
            users: {
              current: subscription.current_users_count,
              max: (subscription.service_packages as any)?.max_users,
            },
            facilities: {
              current: subscription.current_facilities_count,
              max: (subscription.service_packages as any)?.max_facilities,
            },
            products: {
              current: subscription.current_products_count,
              max: (subscription.service_packages as any)?.max_products,
            },
            storage: {
              current: subscription.current_storage_gb,
              max: (subscription.service_packages as any)?.max_storage_gb,
            },
          }
        : null,
    })
  } catch (error: any) {
    console.error("[v0] Recalculate usage error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
