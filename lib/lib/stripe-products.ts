export interface StripeProduct {
  packageCode: string
  stripePriceIdMonthly: string
  stripePriceIdYearly: string
}

// You need to create these products and prices in your Stripe dashboard first
export const STRIPE_PRODUCTS: Record<string, StripeProduct> = {
  FREE: {
    packageCode: "FREE",
    stripePriceIdMonthly: "price_free", // Not used, but kept for consistency
    stripePriceIdYearly: "price_free",
  },
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
  BUSINESS: {
    packageCode: "BUSINESS",
    stripePriceIdMonthly: "price_business_monthly",
    stripePriceIdYearly: "price_business_yearly",
  },
  ENTERPRISE: {
    packageCode: "ENTERPRISE",
    stripePriceIdMonthly: "price_enterprise_monthly", // Contact sales, but kept for custom pricing
    stripePriceIdYearly: "price_enterprise_yearly",
  },
}

export function getStripePriceId(packageCode: string, billingCycle: "monthly" | "yearly"): string | null {
  const product = STRIPE_PRODUCTS[packageCode]
  if (!product) return null

  return billingCycle === "monthly" ? product.stripePriceIdMonthly : product.stripePriceIdYearly
}
