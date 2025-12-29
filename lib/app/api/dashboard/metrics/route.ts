import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile and company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 404 })
    }

    const companyId = profile.company_id

    const { data: metrics, error: metricsError } = await supabase
      .from("mv_company_dashboard_metrics")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle()

    // If materialized view doesn't exist (PGRST205 error), fallback to real-time calculation
    if (metricsError && metricsError.code === "PGRST205") {
      console.log("[v0] Materialized view not found, using real-time calculation")

      // Real-time fallback queries
      const [facilitiesCount, productsCount, tlcsCount, ctesCount] = await Promise.all([
        supabase.from("facilities").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase
          .from("traceability_lot_codes")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("critical_tracking_events")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
      ])

      return NextResponse.json({
        total_facilities: facilitiesCount.count || 0,
        total_products: productsCount.count || 0,
        total_tlcs: tlcsCount.count || 0,
        total_ctes: ctesCount.count || 0,
        active_tlcs: 0,
        expired_tlcs: 0,
        fda_registered_facilities: 0,
        fda_registrations_expiring_soon: 0,
        active_us_agents: 0,
        us_agents_expiring_soon: 0,
        operators_count: 0,
        managers_count: 0,
        storage_usage_percent: 0,
        current_storage_gb: 0,
        max_storage_gb: 0,
      })
    }

    if (metricsError) {
      console.error("[v0] Error fetching dashboard metrics:", metricsError)
      return NextResponse.json({ error: metricsError.message }, { status: 500 })
    }

    // If materialized view is empty, return defaults
    if (!metrics) {
      return NextResponse.json({
        total_facilities: 0,
        total_products: 0,
        total_tlcs: 0,
        total_ctes: 0,
        active_tlcs: 0,
        expired_tlcs: 0,
        fda_registered_facilities: 0,
        fda_registrations_expiring_soon: 0,
        active_us_agents: 0,
        us_agents_expiring_soon: 0,
        operators_count: 0,
        managers_count: 0,
        storage_usage_percent: 0,
        current_storage_gb: 0,
        max_storage_gb: 0,
      })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("[v0] Dashboard metrics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
