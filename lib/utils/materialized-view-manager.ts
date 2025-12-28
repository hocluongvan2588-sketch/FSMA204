/**
 * Materialized View Manager
 * Handles refresh scheduling and cache invalidation
 */

import { createClient } from "@/lib/supabase/server"

export class MaterializedViewManager {
  /**
   * Refresh all materialized views
   * Should be called by cron job every 5 minutes
   */
  static async refreshAll(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Call database function to refresh all views
      const { error } = await supabase.rpc("refresh_all_materialized_views")

      if (error) {
        console.error("[v0] Error refreshing materialized views:", error)
        return { success: false, error: error.message }
      }

      console.log("[v0] ✅ All materialized views refreshed successfully")
      return { success: true }
    } catch (error) {
      console.error("[v0] Fatal error refreshing views:", error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Refresh only stock view (faster, use after CTE operations)
   */
  static async refreshStockView(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      const { error } = await supabase.rpc("refresh_stock_view")

      if (error) {
        console.error("[v0] Error refreshing stock view:", error)
        return { success: false, error: error.message }
      }

      console.log("[v0] ✅ Stock view refreshed")
      return { success: true }
    } catch (error) {
      console.error("[v0] Fatal error refreshing stock view:", error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Get dashboard metrics from materialized view (instant)
   */
  static async getDashboardMetrics(companyId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("mv_company_dashboard_metrics")
      .select("*")
      .eq("company_id", companyId)
      .single()

    if (error) {
      console.error("[v0] Error fetching dashboard metrics:", error)
      return null
    }

    return data
  }

  /**
   * Get TLC stock from materialized view (instant)
   */
  static async getTLCStock(tlcCode: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.from("mv_tlc_current_stock").select("*").eq("tlc_code", tlcCode).single()

    if (error) {
      console.error("[v0] Error fetching TLC stock:", error)
      return null
    }

    return data
  }

  /**
   * Get all negative stock TLCs from materialized view
   */
  static async getNegativeStockTLCs(companyId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("mv_tlc_current_stock")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_negative_stock", true)
      .order("current_stock", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching negative stock TLCs:", error)
      return []
    }

    return data || []
  }

  /**
   * Get compliance alerts from materialized view
   */
  static async getComplianceAlerts(companyId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.from("mv_compliance_alerts").select("*").eq("company_id", companyId).single()

    if (error) {
      console.error("[v0] Error fetching compliance alerts:", error)
      return null
    }

    return data
  }

  /**
   * Check if materialized views need refresh (staleness check)
   */
  static async checkViewFreshness(): Promise<{
    needsRefresh: boolean
    lastRefresh?: Date
    ageMinutes?: number
  }> {
    try {
      const supabase = await createClient()

      // Check last refresh time from any materialized view
      const { data, error } = await supabase
        .from("mv_company_dashboard_metrics")
        .select("last_refreshed")
        .limit(1)
        .single()

      if (error || !data) {
        return { needsRefresh: true }
      }

      const lastRefresh = new Date(data.last_refreshed)
      const now = new Date()
      const ageMinutes = (now.getTime() - lastRefresh.getTime()) / 1000 / 60

      // Refresh if older than 5 minutes
      const needsRefresh = ageMinutes > 5

      return {
        needsRefresh,
        lastRefresh,
        ageMinutes,
      }
    } catch (error) {
      console.error("[v0] Error checking view freshness:", error)
      return { needsRefresh: true }
    }
  }
}
