import { createClient } from "@/lib/supabase/server"

export interface PlanLimits {
  users: number // -1 = unlimited
  facilities: number
  products: number
  storage_gb: number
}

export interface PlanFeatures {
  qr_code: boolean
  cte_tracking: boolean
  kde_management: boolean
  fsma_204_report: boolean
  fda_registration: boolean
  us_agent: boolean
  api_access: boolean
  custom_branding: boolean
  priority_support: boolean
  watermark: boolean // true = has watermark (Free plan only)
}

export interface PlanConfig {
  plan_id: string
  plan_code: string
  name: string
  name_vi: string
  description: string
  description_vi: string
  price_monthly: number
  price_yearly: number
  limits: PlanLimits
  features: PlanFeatures
  is_featured: boolean
  sort_order: number
}

export interface CompanyOverride {
  company_id: string
  overridden_limits?: Partial<PlanLimits>
  overridden_features?: Partial<PlanFeatures>
  notes?: string
  expires_at?: Date
}

/**
 * Get plan configuration from database
 * This is the SINGLE SOURCE OF TRUTH for all plan configs
 */
export async function getPlanConfig(packageCode: string): Promise<PlanConfig | null> {
  const supabase = await createClient()

  const { data: pkg, error } = await supabase
    .from("service_packages")
    .select("*")
    .eq("package_code", packageCode)
    .eq("is_active", true)
    .single()

  if (error || !pkg) {
    console.error("[v0] Error fetching plan config:", error)
    return null
  }

  return {
    plan_id: pkg.id,
    plan_code: pkg.package_code,
    name: pkg.package_name,
    name_vi: pkg.package_name_vi,
    description: pkg.description,
    description_vi: pkg.description_vi,
    price_monthly: pkg.price_monthly,
    price_yearly: pkg.price_yearly,
    limits: {
      users: pkg.max_users,
      facilities: pkg.max_facilities,
      products: pkg.max_products,
      storage_gb: pkg.max_storage_gb,
    },
    features: {
      qr_code: true, // All plans have QR code generation
      cte_tracking: pkg.includes_cte_tracking,
      kde_management: true, // All plans have basic KDE
      fsma_204_report: pkg.includes_reporting,
      fda_registration: pkg.includes_fda_management,
      us_agent: pkg.includes_agent_management,
      api_access: pkg.includes_api_access,
      custom_branding: pkg.includes_custom_branding,
      priority_support: pkg.includes_priority_support,
      watermark: pkg.package_code === "FREE", // Only FREE has watermark
    },
    is_featured: pkg.is_featured,
    sort_order: pkg.sort_order,
  }
}

/**
 * Get all active plan configs
 * Used by pricing page to render all plans
 */
export async function getAllPlanConfigs(): Promise<PlanConfig[]> {
  const supabase = await createClient()

  const { data: packages, error } = await supabase
    .from("service_packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error || !packages) {
    console.error("[v0] Error fetching plan configs:", error)
    return []
  }

  return packages.map((pkg) => ({
    plan_id: pkg.id,
    plan_code: pkg.package_code,
    name: pkg.package_name,
    name_vi: pkg.package_name_vi,
    description: pkg.description,
    description_vi: pkg.description_vi,
    price_monthly: pkg.price_monthly,
    price_yearly: pkg.price_yearly,
    limits: {
      users: pkg.max_users,
      facilities: pkg.max_facilities,
      products: pkg.max_products,
      storage_gb: pkg.max_storage_gb,
    },
    features: {
      qr_code: true,
      cte_tracking: pkg.includes_cte_tracking,
      kde_management: true,
      fsma_204_report: pkg.includes_reporting,
      fda_registration: pkg.includes_fda_management,
      us_agent: pkg.includes_agent_management,
      api_access: pkg.includes_api_access,
      custom_branding: pkg.includes_custom_branding,
      priority_support: pkg.includes_priority_support,
      watermark: pkg.package_code === "FREE",
    },
    is_featured: pkg.is_featured,
    sort_order: pkg.sort_order,
  }))
}

/**
 * Get company's effective plan config with overrides applied
 * This handles admin overrides for individual accounts
 */
export async function getCompanyEffectivePlan(companyId: string): Promise<PlanConfig | null> {
  const supabase = await createClient()

  const { data: subscription, error: subError } = await supabase
    .from("company_subscriptions")
    .select(`
      *,
      service_packages (
        id,
        package_name,
        package_code,
        max_users,
        max_facilities,
        max_products,
        max_storage_gb,
        includes_fda_management,
        includes_agent_management,
        includes_cte_tracking,
        includes_reporting,
        includes_api_access,
        includes_custom_branding,
        includes_priority_support
      )
    `)
    .eq("company_id", companyId)
    .in("subscription_status", ["active", "trial"])
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (subError || !subscription || !subscription.service_packages) {
    console.log("[v0] No active/trial subscription found for company:", companyId, subError)
    return null
  }

  // Get base plan config
  const basePlan = await getPlanConfig(subscription.service_packages.package_code)
  if (!basePlan) return null

  // Check for admin overrides
  const { data: override } = await supabase
    .from("company_subscription_overrides")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .single()

  if (!override) {
    return basePlan
  }

  // Apply overrides
  return {
    ...basePlan,
    limits: {
      ...basePlan.limits,
      ...override.overridden_limits,
    },
    features: {
      ...basePlan.features,
      ...override.overridden_features,
    },
  }
}

/**
 * Check if company has access to a feature
 * Checks plan config + overrides
 */
export async function hasFeatureAccess(companyId: string, feature: keyof PlanFeatures): Promise<boolean> {
  const plan = await getCompanyEffectivePlan(companyId)
  if (!plan) return false
  return plan.features[feature]
}

/**
 * Check quota limit
 * Returns { allowed, current, limit, remaining }
 */
export async function checkQuota(
  companyId: string,
  quotaType: keyof PlanLimits,
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const supabase = await createClient()
  const plan = await getCompanyEffectivePlan(companyId)

  if (!plan) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 }
  }

  const limit = plan.limits[quotaType]

  // Get current usage
  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("current_users_count, current_facilities_count, current_products_count, current_storage_gb")
    .eq("company_id", companyId)
    .single()

  const currentMap = {
    users: subscription?.current_users_count || 0,
    facilities: subscription?.current_facilities_count || 0,
    products: subscription?.current_products_count || 0,
    storage_gb: subscription?.current_storage_gb || 0,
  }

  const current = currentMap[quotaType]
  const unlimited = limit === -1
  const allowed = unlimited || current < limit

  return {
    allowed,
    current,
    limit,
    remaining: unlimited ? -1 : limit - current,
  }
}
