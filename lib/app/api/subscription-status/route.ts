import { NextResponse } from "next/server"
import { getDaysRemaining, getSubscriptionStatus } from "@/lib/subscription-lifecycle"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Verify user has access to this company
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).single()

    if (profile?.role !== "system_admin" && profile?.company_id !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("[v0] Fetching subscription status for company:", companyId)

    const status = await getSubscriptionStatus(companyId)
    console.log("[v0] Subscription status result:", status)

    const daysRemaining = await getDaysRemaining(companyId)
    console.log("[v0] Days remaining result:", daysRemaining)

    return NextResponse.json({
      status: status?.status || "none",
      daysRemaining,
      trialEndDate: status?.trialEndDate,
      endDate: status?.endDate,
      packageName: status?.packageName,
    })
  } catch (error: any) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
