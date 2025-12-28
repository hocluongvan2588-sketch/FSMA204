import { getCompanySubscription } from "@/lib/quota"

export interface WatermarkConfig {
  text: string
  opacity: number
  fontSize: number
  color: string
  rotation: number
}

/**
 * Get watermark configuration for free tier
 */
export function getWatermarkConfig(): WatermarkConfig {
  return {
    text: "FoodTrace Free - Nâng cấp để xóa watermark",
    opacity: 0.15,
    fontSize: 24,
    color: "#64748b",
    rotation: -45,
  }
}

/**
 * Check if watermark should be applied based on subscription (Server-side only)
 */
export async function shouldApplyWatermark(companyId: string): Promise<boolean> {
  const subscription = await getCompanySubscription(companyId)

  if (!subscription) return true // Default to watermark if no subscription

  // Apply watermark only for Free tier
  return subscription.packageName.toLowerCase().includes("free")
}
