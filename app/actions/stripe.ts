"use server"

import { getStripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { getStripePriceId } from "@/lib/stripe-products"

export async function createSubscriptionCheckout(
  companyId: string,
  packageId: string,
  billingCycle: "monthly" | "yearly",
) {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Get company details
  const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single()

  if (!company) {
    throw new Error("Company not found")
  }

  // Get package details
  const { data: pkg } = await supabase.from("service_packages").select("*").eq("id", packageId).single()

  if (!pkg) {
    throw new Error("Package not found")
  }

  // Get or create Stripe customer for company
  let stripeCustomerId = company.stripe_customer_id

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: company.name,
      metadata: {
        company_id: companyId,
        user_id: user.id,
      },
    })

    stripeCustomerId = customer.id

    // Save Stripe customer ID to company
    await supabase.from("companies").update({ stripe_customer_id: stripeCustomerId }).eq("id", companyId)
  }

  // Get Stripe Price ID
  const stripePriceId = getStripePriceId(pkg.package_code, billingCycle)
  if (!stripePriceId) {
    throw new Error("Stripe price not configured for this package")
  }

  // Create Stripe Checkout Session for subscription
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
      metadata: {
        company_id: companyId,
        package_id: packageId,
        billing_cycle: billingCycle,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?canceled=true`,
    metadata: {
      company_id: companyId,
      package_id: packageId,
      billing_cycle: billingCycle,
    },
  })

  return { sessionId: session.id, url: session.url }
}

export async function createPortalSession(companyId: string) {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  const supabase = await createClient()

  // Get company details
  const { data: company } = await supabase.from("companies").select("stripe_customer_id").eq("id", companyId).single()

  if (!company?.stripe_customer_id) {
    throw new Error("No Stripe customer found")
  }

  // Create Stripe Billing Portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription`,
  })

  return { url: session.url }
}

export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripe()
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  const supabase = await createClient()

  // Get subscription
  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("stripe_subscription_id")
    .eq("id", subscriptionId)
    .single()

  if (!subscription?.stripe_subscription_id) {
    throw new Error("Stripe subscription not found")
  }

  // Cancel at period end (don't cancel immediately)
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  // Update database
  await supabase.from("company_subscriptions").update({ subscription_status: "cancelled" }).eq("id", subscriptionId)

  return { success: true }
}
