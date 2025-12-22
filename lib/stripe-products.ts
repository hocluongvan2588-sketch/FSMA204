export interface StripeProduct {
  packageCode: string
  stripePriceIdMonthly: string
  stripePriceIdYearly: string
}

// This maps service package codes to Stripe Price IDs
// You need to create these products and prices in your Stripe dashboard first
export const STRIPE_PRODUCTS: Record<string, StripeProduct> = {
  STARTER: {
    packageCode: "STARTER",
    stripePriceIdMonthly: "price_starter_monthly", // Replace with actual Stripe Price ID
    stripePriceIdYearly: "price_starter_yearly", // Replace with actual Stripe Price ID
  },
  PROFESSIONAL: {
    packageCode: "PROFESSIONAL",
    stripePriceIdMonthly: "price_professional_monthly",
    stripePriceIdYearly: "price_professional_yearly",
  },
  ENTERPRISE: {
    packageCode: "ENTERPRISE",
    stripePriceIdMonthly: "price_enterprise_monthly",
    stripePriceIdYearly: "price_enterprise_yearly",
  },
}

export function getStripePriceId(packageCode: string, billingCycle: "monthly" | "yearly"): string | null {
  const product = STRIPE_PRODUCTS[packageCode]
  if (!product) return null

  return billingCycle === "monthly" ? product.stripePriceIdMonthly : product.stripePriceIdYearly
}
