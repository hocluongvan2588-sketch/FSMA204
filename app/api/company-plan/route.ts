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
      .select("status, service_packages!inner(name)")
      .eq("company_id", companyId)
      .in("status", ["active", "trial"])
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

    const pkg = subscription.service_packages as any

    return NextResponse.json({
      plan: {
        name: pkg.name,
        code: pkg.name.toUpperCase().replace(/\s+/g, "_"), // Generate code from name
        status: subscription.status,
      },
    })
  } catch (error) {
    console.error("[v0] Company plan fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 })
  }
}
