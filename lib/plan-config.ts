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
  display_order: number
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
export async function getPlanConfig(planName: string): Promise<PlanConfig | null> {
  const supabase = await createClient()

  const { data: pkg, error } = await supabase
    .from("service_packages")
    .select("id, name, description, price_monthly, price_yearly, features, limits, display_order, is_active")
    .eq("name", planName)
    .eq("is_active", true)
    .single()

  if (error || !pkg) {
    console.error("[v0] Error fetching plan config:", error)
    return null
  }

  return {
    plan_id: pkg.id,
    plan_code: extractPlanCode(pkg.name),
    name: pkg.name,
    name_vi: pkg.name,
    description: pkg.description || "",
    description_vi: pkg.description || "",
    price_monthly: pkg.price_monthly,
    price_yearly: pkg.price_yearly,
    limits: {
      users: pkg.limits?.max_users ?? -1,
      facilities: pkg.limits?.max_facilities ?? -1,
      products: pkg.limits?.max_products ?? -1,
      storage_gb: pkg.limits?.max_storage_gb ?? 100,
    },
    features: {
      qr_code: true,
      cte_tracking: pkg.features?.cte_tracking ?? true,
      kde_management: true,
      fsma_204_report: pkg.features?.fsma_204_report ?? true,
      fda_registration: pkg.features?.fda_registration ?? false,
      us_agent: pkg.features?.us_agent ?? false,
      api_access: pkg.features?.api_access ?? false,
      custom_branding: pkg.features?.custom_branding ?? false,
      priority_support: pkg.features?.priority_support ?? false,
      watermark: pkg.name === "Free",
    },
    is_featured: pkg.name === "Professional",
    display_order: pkg.display_order || 0,
  }
}

/**
 * Get all active plan configs
 * Used by pricing page to render all plans
 */
export async function getAllPlanConfigs(): Promise<PlanConfig[]> {
  const supabase = await createClient()

  console.log("[v0] Fetching all plan configs from service_packages...")

  const { data: packages, error } = await supabase
    .from("service_packages")
    .select("id, name, description, price_monthly, price_yearly, features, limits, display_order, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  console.log("[v0] Query result:", { packages, error, count: packages?.length })

  if (error) {
    console.error("[v0] Error fetching plan configs:", error)
    return []
  }

  if (!packages || packages.length === 0) {
    console.log("[v0] No packages found in database")
    return []
  }

  const mappedPackages = packages.map((pkg) => {
    console.log("[v0] Mapping package:", pkg.name, { limits: pkg.limits, features: pkg.features })

    return {
      plan_id: pkg.id,
      plan_code: extractPlanCode(pkg.name),
      name: pkg.name,
      name_vi: pkg.name,
      description: pkg.description || "",
      description_vi: pkg.description || "",
      price_monthly: pkg.price_monthly,
      price_yearly: pkg.price_yearly,
      limits: {
        users: pkg.limits?.max_users ?? -1,
        facilities: pkg.limits?.max_facilities ?? -1,
        products: pkg.limits?.max_products ?? -1,
        storage_gb: pkg.limits?.max_storage_gb ?? 100,
      },
      features: {
        qr_code: true,
        cte_tracking: pkg.features?.cte_tracking ?? true,
        kde_management: true,
        fsma_204_report: pkg.features?.fsma_204_report ?? true,
        fda_registration: pkg.features?.fda_registration ?? false,
        us_agent: pkg.features?.us_agent ?? false,
        api_access: pkg.features?.api_access ?? false,
        custom_branding: pkg.features?.custom_branding ?? false,
        priority_support: pkg.features?.priority_support ?? false,
        watermark: pkg.name === "Free",
      },
      is_featured: pkg.name === "Professional",
      display_order: pkg.display_order || 0,
    }
  })

  console.log("[v0] Mapped packages count:", mappedPackages.length)
  return mappedPackages
}

function extractPlanCode(name: string): string {
  return name.toUpperCase().replace(/\s+/g, "_")
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
      service_packages:package_id (
        id,
        name,
        description,
        price_monthly,
        price_yearly,
        features,
        limits,
        display_order,
        is_active
      )
    `)
    .eq("company_id", companyId)
    .in("status", ["active", "trial"])
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (subError || !subscription || !subscription.service_packages) {
    console.log("[v0] No active/trial subscription found for company:", companyId, subError)
    return null
  }

  const basePlan = await getPlanConfig(subscription.service_packages.name)
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

  // These columns don't exist in company_subscriptions table
  const current = 0 // TODO: Implement actual usage tracking

  const unlimited = limit === -1
  const allowed = unlimited || current < limit

  return {
    allowed,
    current,
    limit,
    remaining: unlimited ? -1 : limit - current,
  }
}
