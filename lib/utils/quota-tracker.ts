import { createClient } from "@/lib/supabase/client"

export interface QuotaInfo {
  used: number
  limit: number
  percentage: number
  remaining: number
  warningLevel: "safe" | "warning" | "critical"
}

export async function getQuotaInfo(companyId: string): Promise<QuotaInfo> {
  const supabase = createClient()

  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("*, service_packages(max_storage_gb)")
    .eq("company_id", companyId)
    .in("subscription_status", ["active", "trial"])
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  // Default limit if no subscription (free tier)
  const limit = subscription?.service_packages?.max_storage_gb
    ? subscription.service_packages.max_storage_gb * 100
    : 100

  // Count CTE events created this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from("critical_tracking_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString())

  const used = count || 0
  const percentage = Math.round((used / limit) * 100)
  const remaining = Math.max(0, limit - used)

  let warningLevel: "safe" | "warning" | "critical" = "safe"
  if (percentage >= 90) {
    warningLevel = "critical"
  } else if (percentage >= 75) {
    warningLevel = "warning"
  }

  return {
    used,
    limit,
    percentage,
    remaining,
    warningLevel,
  }
}
