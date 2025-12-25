import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: subscription } = await supabase
      .from("company_subscriptions")
      .select("subscription_status, service_packages(package_name, package_code)")
      .eq("company_id", companyId)
      .in("subscription_status", ["active", "trial"])
      .order("start_date", { ascending: false })
      .limit(1)
      .single()

    if (!subscription || !subscription.service_packages) {
      return NextResponse.json({
        plan: {
          name: "Free",
          code: "FREE",
          status: "active",
        },
      })
    }

    return NextResponse.json({
      plan: {
        name: subscription.service_packages.package_name,
        code: subscription.service_packages.package_code,
        status: subscription.subscription_status,
      },
    })
  } catch (error) {
    console.error("[v0] Company plan fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 })
  }
}
