import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { companyId, fileSizeBytes } = await request.json()

    if (!companyId || typeof fileSizeBytes !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get company subscription with storage limits
    const { data: subscription } = await supabase
      .from("company_subscriptions")
      .select(
        `
        current_storage_gb,
        service_packages!inner (max_storage_gb)
      `,
      )
      .eq("company_id", companyId)
      .eq("subscription_status", "active")
      .single()

    if (!subscription || !subscription.service_packages) {
      return NextResponse.json({
        allowed: false,
        current_gb: 0,
        max_gb: 0,
        remaining_gb: 0,
        usage_percentage: 100,
        warning_threshold: true,
      })
    }

    const currentGB = subscription.current_storage_gb || 0
    const maxGB = (subscription.service_packages as any).max_storage_gb || 0
    const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024)
    const newTotalGB = currentGB + fileSizeGB
    const remainingGB = Math.max(maxGB - currentGB, 0)
    const usagePercentage = maxGB > 0 ? (currentGB / maxGB) * 100 : 0

    // Check for admin overrides
    const { data: override } = await supabase
      .from("company_subscription_overrides")
      .select("overridden_limits")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single()

    const effectiveMaxGB = override?.overridden_limits?.storage_gb || maxGB
    const allowed = newTotalGB <= effectiveMaxGB

    return NextResponse.json({
      allowed,
      current_gb: currentGB,
      max_gb: effectiveMaxGB,
      remaining_gb: effectiveMaxGB - currentGB,
      usage_percentage: usagePercentage,
      warning_threshold: usagePercentage >= 80,
    })
  } catch (error) {
    console.error("[v0] Storage quota check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
