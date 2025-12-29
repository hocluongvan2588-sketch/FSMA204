import { prisma } from "@/lib/prisma"

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

export interface QuotaCheck {
  allowed: boolean
  currentUsage: number
  maxAllowed: number
  remaining: number
  subscriptionStatus: string
}

/**
 * Get company's active subscription with quotas
 */
export async function getCompanySubscription(companyId: string): Promise<SubscriptionQuotas | null> {
  try {
    const subscription = await prisma.company_subscriptions.findFirst({
      where: {
        company_id: companyId,
        status: {
          in: ["active", "trial"],
        },
      },
      include: {
        service_packages: true,
      },
      orderBy: {
        start_date: "desc",
      },
    })

    if (!subscription || !subscription.service_packages) {
      console.log("[v0] No subscription found, attempting to create FREE subscription")

      // Try to auto-create FREE subscription
      const freePackage = await prisma.service_packages.findFirst({
        where: {
          package_code: "FREE",
          is_active: true,
        },
      })

      if (freePackage) {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 100)

        await prisma.company_subscriptions.create({
          data: {
            company_id: companyId,
            package_id: freePackage.id,
            status: "active",
            billing_cycle: "monthly",
            start_date: startDate,
            end_date: endDate,
            price_paid: 0,
            auto_renew: false,
          },
        })

        console.log("[v0] Auto-created FREE subscription for company:", companyId)

        return {
          maxUsers: (freePackage.limits as any)?.max_users || 5,
          maxFacilities: (freePackage.limits as any)?.max_facilities || 1,
          maxProducts: (freePackage.limits as any)?.max_products || 10,
          maxStorageGb: (freePackage.limits as any)?.max_storage_gb || 1,
          currentUsers: 0,
          currentFacilities: 0,
          currentProducts: 0,
          currentStorageGb: 0,
          subscriptionStatus: "active",
          packageName: freePackage.name,
          features: {
            fda: (freePackage.features as any)?.fda_registration === true,
            agent: (freePackage.features as any)?.us_agent === true,
            cte: (freePackage.features as any)?.cte_tracking === true,
            reporting: (freePackage.features as any)?.advanced_reporting === true,
            api: (freePackage.features as any)?.api_access === true,
            branding: (freePackage.features as any)?.custom_branding === true,
          },
        }
      }

      return null
    }

    const pkg = subscription.service_packages
    const limits = (pkg.limits as any) || {}
    const features = (pkg.features as any) || {}

    return {
      maxUsers: limits.max_users || 1,
      maxFacilities: limits.max_facilities || 1,
      maxProducts: limits.max_products || 3,
      maxStorageGb: limits.max_storage_gb || 0,
      currentUsers: subscription.current_users_count || 0,
      currentFacilities: subscription.current_facilities_count || 0,
      currentProducts: subscription.current_products_count || 0,
      currentStorageGb: subscription.current_storage_gb || 0,
      subscriptionStatus: subscription.status,
      packageName: pkg.name,
      features: {
        fda: features.fda_registration === true,
        agent: features.us_agent === true,
        cte: features.cte_tracking === true,
        reporting: features.advanced_reporting === true,
        api: features.api_access === true,
        branding: features.custom_branding === true,
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching subscription:", error)
    return null
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
 * Recalculate and sync usage counts from actual database records
 */
export async function recalculateUsage(companyId: string): Promise<void> {
  try {
    const [actualUsers, actualFacilities, actualProducts] = await Promise.all([
      prisma.profiles.count({ where: { company_id: companyId } }),
      prisma.facilities.count({ where: { company_id: companyId } }),
      prisma.products.count({ where: { company_id: companyId } }),
    ])

    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_users_count: actualUsers,
        current_facilities_count: actualFacilities,
        current_products_count: actualProducts,
      },
    })

    console.log("[v0] Recalculated usage for company:", companyId, {
      users: actualUsers,
      facilities: actualFacilities,
      products: actualProducts,
    })
  } catch (error) {
    console.error("[v0] Error recalculating usage:", error)
    throw error
  }
}
