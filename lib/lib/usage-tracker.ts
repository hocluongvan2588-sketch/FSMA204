import { prisma } from "@/lib/prisma"

/**
 * Increment user count for a company
 */
export async function incrementUserCount(companyId: string): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_users_count: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error incrementing user count:", error)
  }
}

/**
 * Decrement user count for a company
 */
export async function decrementUserCount(companyId: string): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_users_count: {
          decrement: 1,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error decrementing user count:", error)
  }
}

/**
 * Increment facility count for a company
 */
export async function incrementFacilityCount(companyId: string): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_facilities_count: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error incrementing facility count:", error)
  }
}

/**
 * Decrement facility count for a company
 */
export async function decrementFacilityCount(companyId: string): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_facilities_count: {
          decrement: 1,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error decrementing facility count:", error)
  }
}

/**
 * Increment product count for a company
 */
export async function incrementProductCount(companyId: string): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_products_count: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error incrementing product count:", error)
  }
}

/**
 * Decrement product count for a company
 */
export async function decrementProductCount(companyId: string): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_products_count: {
          decrement: 1,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error decrementing product count:", error)
  }
}

/**
 * Update storage usage for a company
 */
export async function updateStorageUsage(companyId: string, storageGb: number): Promise<void> {
  try {
    await prisma.company_subscriptions.updateMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      data: {
        current_storage_gb: storageGb,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating storage usage:", error)
  }
}

/**
 * Recalculate all usage counts for a company
 */
export async function recalculateUsage(companyId: string): Promise<void> {
  try {
    const [userCount, facilityCount, productCount] = await Promise.all([
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
        current_users_count: userCount,
        current_facilities_count: facilityCount,
        current_products_count: productCount,
      },
    })
  } catch (error) {
    console.error("[v0] Error recalculating usage:", error)
  }
}
