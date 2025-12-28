/**
 * FSMA 204 Compliant Expiration Date Calculator - Client-side utilities
 * Pure functions for calculating and validating expiration dates (no server dependencies)
 */

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
