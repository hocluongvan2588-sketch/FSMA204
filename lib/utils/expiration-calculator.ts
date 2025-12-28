/**
 * FSMA 204 Compliant Expiration Date Calculator
 * Calculates and validates expiration dates based on product shelf life
 */

import { createClient } from "@/lib/supabase/server"

export interface ExpirationCalculation {
  productionDate: Date
  shelfLifeDays: number
  expiryDate: Date
  daysUntilExpiry: number
  status: "good" | "monitor" | "expiring_soon" | "expired"
  warningMessage?: string
}

export interface ProductShelfLife {
  shelfLifeDays: number | null
  storageTemperatureMin: number | null
  storageTemperatureMax: number | null
  requiresExpiryDate: boolean
}

/**
 * Calculate expiration date from production date and shelf life
 */
export function calculateExpiryDate(productionDate: Date, shelfLifeDays: number): Date {
  const expiry = new Date(productionDate)
  expiry.setDate(expiry.getDate() + shelfLifeDays)
  return expiry
}

/**
 * Get expiration status based on days until expiry
 */
export function getExpirationStatus(expiryDate: Date): {
  status: "good" | "monitor" | "expiring_soon" | "expired"
  daysUntilExpiry: number
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let status: "good" | "monitor" | "expiring_soon" | "expired"

  if (daysUntilExpiry < 0) {
    status = "expired"
  } else if (daysUntilExpiry <= 7) {
    status = "expiring_soon"
  } else if (daysUntilExpiry <= 30) {
    status = "monitor"
  } else {
    status = "good"
  }

  return { status, daysUntilExpiry }
}

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
    console.error("[v0] Failed to fetch product shelf life:", error)
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

/**
 * Validate if product can be used in CTE based on expiration
 */
export function canUseProductInCTE(expiryDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  return expiry >= today
}

/**
 * Get expiration alert color for UI
 */
export function getExpirationAlertColor(status: "good" | "monitor" | "expiring_soon" | "expired"): string {
  switch (status) {
    case "expired":
      return "bg-red-50 border-red-200 text-red-800"
    case "expiring_soon":
      return "bg-orange-50 border-orange-200 text-orange-800"
    case "monitor":
      return "bg-yellow-50 border-yellow-200 text-yellow-800"
    case "good":
      return "bg-green-50 border-green-200 text-green-800"
  }
}
