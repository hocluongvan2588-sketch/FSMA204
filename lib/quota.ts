import { createClient } from "@/lib/supabase/server"

export interface QuotaCheck {
  allowed: boolean
  currentUsage: number
  maxAllowed: number
  remaining: number
  subscriptionStatus: string
}

export interface SubscriptionQuotas {
  maxUsers: number
  maxFacilities: number
  maxProducts: number
  maxStorageGb: number
  currentUsers: number
  currentFacilities: number
  currentProducts: number
  currentStorageGb: number
  subscriptionStatus: string
  packageName: string
  features: {
    fda: boolean
    agent: boolean
    cte: boolean
    reporting: boolean
    api: boolean
    branding: boolean
  }
}

export interface SubscriptionLimits {
  maxUsers: number
  maxFacilities: number
  maxProducts: number
  maxStorageGB: number
}

/**
 * Get company's active subscription with quotas
 */
export async function getCompanySubscription(companyId: string): Promise<SubscriptionQuotas | null> {
  const supabase = await createClient()

  const { data: subscription, error } = await supabase
    .from("company_subscriptions")
    .select(`
      *,
      service_packages (
        package_name,
        max_users,
        max_facilities,
        max_products,
        max_storage_gb,
        includes_fda_management,
        includes_agent_management,
        includes_cte_tracking,
        includes_reporting,
        includes_api_access,
        includes_custom_branding
      )
    `)
    .eq("company_id", companyId)
    .in("subscription_status", ["active", "trial"])
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (error || !subscription || !subscription.service_packages) {
    console.log("[v0] No active/trial subscription found for company:", companyId, error)
    return null
  }

  const pkg = subscription.service_packages as any

  return {
    maxUsers: pkg.max_users,
    maxFacilities: pkg.max_facilities,
    maxProducts: pkg.max_products,
    maxStorageGb: pkg.max_storage_gb,
    currentUsers: subscription.current_users_count || 0,
    currentFacilities: subscription.current_facilities_count || 0,
    currentProducts: subscription.current_products_count || 0,
    currentStorageGb: subscription.current_storage_gb || 0,
    subscriptionStatus: subscription.subscription_status,
    packageName: pkg.package_name,
    features: {
      fda: pkg.includes_fda_management,
      agent: pkg.includes_agent_management,
      cte: pkg.includes_cte_tracking,
      reporting: pkg.includes_reporting,
      api: pkg.includes_api_access,
      branding: pkg.includes_custom_branding,
    },
  }
}

/**
 * Check if company can add more users
 */
export async function checkUserQuota(companyId: string): Promise<QuotaCheck> {
  const subscription = await getCompanySubscription(companyId)

  if (!subscription) {
    return {
      allowed: false,
      currentUsage: 0,
      maxAllowed: 0,
      remaining: 0,
      subscriptionStatus: "none",
    }
  }

  const unlimited = subscription.maxUsers === -1
  const allowed =
    (subscription.subscriptionStatus === "active" || subscription.subscriptionStatus === "trial") &&
    (unlimited || subscription.currentUsers < subscription.maxUsers)

  return {
    allowed,
    currentUsage: subscription.currentUsers,
    maxAllowed: subscription.maxUsers,
    remaining: unlimited ? -1 : subscription.maxUsers - subscription.currentUsers,
    subscriptionStatus: subscription.subscriptionStatus,
  }
}

/**
 * Check if company can add more facilities
 */
export async function checkFacilityQuota(companyId: string): Promise<QuotaCheck> {
  const subscription = await getCompanySubscription(companyId)

  if (!subscription) {
    return {
      allowed: false,
      currentUsage: 0,
      maxAllowed: 0,
      remaining: 0,
      subscriptionStatus: "none",
    }
  }

  const unlimited = subscription.maxFacilities === -1
  const allowed =
    (subscription.subscriptionStatus === "active" || subscription.subscriptionStatus === "trial") &&
    (unlimited || subscription.currentFacilities < subscription.maxFacilities)

  return {
    allowed,
    currentUsage: subscription.currentFacilities,
    maxAllowed: subscription.maxFacilities,
    remaining: unlimited ? -1 : subscription.maxFacilities - subscription.currentFacilities,
    subscriptionStatus: subscription.subscriptionStatus,
  }
}

/**
 * Check if company can add more products
 */
export async function checkProductQuota(companyId: string): Promise<QuotaCheck> {
  const subscription = await getCompanySubscription(companyId)

  if (!subscription) {
    return {
      allowed: false,
      currentUsage: 0,
      maxAllowed: 0,
      remaining: 0,
      subscriptionStatus: "none",
    }
  }

  const unlimited = subscription.maxProducts === -1
  const allowed =
    (subscription.subscriptionStatus === "active" || subscription.subscriptionStatus === "trial") &&
    (unlimited || subscription.currentProducts < subscription.maxProducts)

  return {
    allowed,
    currentUsage: subscription.currentProducts,
    maxAllowed: subscription.maxProducts,
    remaining: unlimited ? -1 : subscription.maxProducts - subscription.currentProducts,
    subscriptionStatus: subscription.subscriptionStatus,
  }
}

/**
 * Check if company has access to a specific feature
 */
export async function checkFeatureAccess(
  companyId: string,
  feature: "fda" | "agent" | "cte" | "reporting" | "api" | "branding",
): Promise<boolean> {
  const subscription = await getCompanySubscription(companyId)

  if (!subscription || (subscription.subscriptionStatus !== "active" && subscription.subscriptionStatus !== "trial")) {
    return false
  }

  return subscription.features[feature]
}

/**
 * Middleware to check subscription status before allowing access
 */
export async function requireActiveSubscription(companyId: string): Promise<boolean> {
  const subscription = await getCompanySubscription(companyId)
  return (
    subscription !== null &&
    (subscription.subscriptionStatus === "active" || subscription.subscriptionStatus === "trial")
  )
}

/**
 * Recalculate and sync usage counts from actual database records
 * Useful for fixing out-of-sync counters
 */
export async function recalculateUsage(companyId: string): Promise<void> {
  const supabase = await createClient()

  // Count actual records in database
  const [usersResult, facilitiesResult, productsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("facilities").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", companyId),
  ])

  const actualUsers = usersResult.count || 0
  const actualFacilities = facilitiesResult.count || 0
  const actualProducts = productsResult.count || 0

  // Update subscription with actual counts
  const { error } = await supabase
    .from("company_subscriptions")
    .update({
      current_users_count: actualUsers,
      current_facilities_count: actualFacilities,
      current_products_count: actualProducts,
    })
    .eq("company_id", companyId)
    .eq("subscription_status", "active")

  if (error) {
    console.error("[v0] Error recalculating usage:", error)
    throw error
  }

  console.log("[v0] Recalculated usage for company:", companyId, {
    users: actualUsers,
    facilities: actualFacilities,
    products: actualProducts,
  })
}

async function getSubscriptionLimits(companyId: string): Promise<SubscriptionLimits | null> {
  const supabase = await createClient()

  const { data: subscription, error } = await supabase
    .from("company_subscriptions")
    .select(`
      *,
      service_packages (
        package_name,
        max_users,
        max_facilities,
        max_products,
        max_storage_gb,
        includes_fda_management,
        includes_agent_management,
        includes_cte_tracking,
        includes_reporting,
        includes_api_access,
        includes_custom_branding
      )
    `)
    .eq("company_id", companyId)
    .in("subscription_status", ["active", "trial"])
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (error || !subscription || !subscription.service_packages) {
    console.log("[v0] No active/trial subscription found for company:", companyId, error)
    return null
  }

  const pkg = subscription.service_packages as any

  return {
    maxUsers: pkg.max_users,
    maxFacilities: pkg.max_facilities,
    maxProducts: pkg.max_products,
    maxStorageGB: pkg.max_storage_gb,
  }
}
