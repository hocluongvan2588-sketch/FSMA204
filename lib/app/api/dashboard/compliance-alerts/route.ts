import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 404 })
    }

    const companyId = profile.company_id

    const { data: alerts, error: alertsError } = await supabase
      .from("mv_compliance_alerts")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle()

    if (alertsError && alertsError.code === "PGRST205") {
      console.log("[v0] Materialized view not found, using real-time compliance calculation")

      // Real-time fallback: basic compliance check
      const { data: ctes, error: cteError } = await supabase
        .from("critical_tracking_events")
        .select("id, key_data_elements")
        .eq("company_id", companyId)

      const missingKdeCount =
        ctes?.filter((cte) => !cte.key_data_elements || cte.key_data_elements.length === 0).length || 0

      return NextResponse.json({
        total_alerts: missingKdeCount > 0 ? 1 : 0,
        missing_kde_count: missingKdeCount,
        chronological_violations: 0,
        negative_stock_tlcs: 0,
      })
    }

    if (alertsError) {
      console.error("[v0] Error fetching compliance alerts:", alertsError)
      return NextResponse.json({ error: alertsError.message }, { status: 500 })
    }

    if (!alerts) {
      return NextResponse.json({
        total_alerts: 0,
        missing_kde_count: 0,
        chronological_violations: 0,
        negative_stock_tlcs: 0,
      })
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error("[v0] Compliance alerts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
