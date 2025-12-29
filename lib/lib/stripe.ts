import "server-only"

import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      // During build time, return null instead of throwing
      if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
        return null
      }
      console.warn("STRIPE_SECRET_KEY is not set in environment variables")
      return null
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    })
  }
  return _stripe
}
