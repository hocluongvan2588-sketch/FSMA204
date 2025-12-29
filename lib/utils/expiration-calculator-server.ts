/**
 * Server-side expiration calculator functions
 * These functions require database access and can only be used in Server Components or API routes
 */

import { createClient } from "@/lib/supabase/server"
import {
  calculateExpiryDate,
  getExpirationStatus,
  type ExpirationCalculation,
  type ProductShelfLife,
} from "./expiration-calculator"

/**
 * Fetch product shelf life from database
 */
export async function getProductShelfLife(productId: string): Promise<ProductShelfLife | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("shelf_life_days, storage_temperature_min, storage_temperature_max, requires_expiry_date")
    .eq("id", productId)
    .single()

  if (error || !data) {
    console.error("Failed to fetch product shelf life:", error)
    return null
  }

  return {
    shelfLifeDays: data.shelf_life_days,
    storageTemperatureMin: data.storage_temperature_min,
    storageTemperatureMax: data.storage_temperature_max,
    requiresExpiryDate: data.requires_expiry_date ?? true,
  }
}

/**
 * Calculate full expiration information
 */
export async function calculateExpirationInfo(
  productId: string,
  productionDate: Date,
): Promise<ExpirationCalculation | null> {
  const shelfLife = await getProductShelfLife(productId)

  if (!shelfLife || !shelfLife.shelfLifeDays) {
    return null
  }

  const expiryDate = calculateExpiryDate(productionDate, shelfLife.shelfLifeDays)
  const { status, daysUntilExpiry } = getExpirationStatus(expiryDate)

  let warningMessage: string | undefined

  if (status === "expired") {
    warningMessage = "⚠️ Sản phẩm đã hết hạn sử dụng. Không được phép sử dụng trong CTE."
  } else if (status === "expiring_soon") {
    warningMessage = `⚠️ Sản phẩm sắp hết hạn trong ${daysUntilExpiry} ngày. Ưu tiên sử dụng.`
  } else if (status === "monitor") {
    warningMessage = `ℹ️ Sản phẩm còn ${daysUntilExpiry} ngày hết hạn.`
  }

  return {
    productionDate,
    shelfLifeDays: shelfLife.shelfLifeDays,
    expiryDate,
    daysUntilExpiry,
    status,
    warningMessage,
  }
}
