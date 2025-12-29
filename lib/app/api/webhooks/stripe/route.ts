import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

const getWebhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const stripe = getStripe()

  if (!stripe) {
    console.error("[v0] Stripe is not configured")
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const webhookSecret = getWebhookSecret()

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("[v0] Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        console.log("[v0] Checkout session completed:", session.id)

        // Get metadata
        const companyId = session.metadata?.company_id
        const packageId = session.metadata?.package_id
        const billingCycle = session.metadata?.billing_cycle as "monthly" | "yearly"

        if (!companyId || !packageId) {
          console.error("[v0] Missing metadata in checkout session")
          break
        }

        // Get package details
        const { data: pkg } = await supabase.from("service_packages").select("*").eq("id", packageId).single()

        if (!pkg) {
          console.error("[v0] Package not found:", packageId)
          break
        }

        // Calculate subscription dates
        const startDate = new Date()
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 30) // 30-day trial

        const endDate = new Date(trialEndDate)
        if (billingCycle === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        // Calculate price
        const price = billingCycle === "monthly" ? pkg.price_monthly : pkg.price_yearly

        // Create subscription in database
        await supabase.from("company_subscriptions").insert({
          company_id: companyId,
          package_id: packageId,
          subscription_status: "trial",
          billing_cycle: billingCycle,
          start_date: startDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          end_date: endDate.toISOString(),
          current_price: price,
          payment_method: "stripe",
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
        })

        console.log("[v0] Subscription created for company:", companyId)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        console.log("[v0] Subscription updated:", subscription.id)

        // Update subscription status in database
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "trialing"
              ? "trial"
              : subscription.status === "past_due"
                ? "past_due"
                : subscription.status === "canceled"
                  ? "cancelled"
                  : "expired"

        await supabase
          .from("company_subscriptions")
          .update({ subscription_status: status })
          .eq("stripe_subscription_id", subscription.id)

        console.log("[v0] Subscription status updated to:", status)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        console.log("[v0] Subscription deleted:", subscription.id)

        // Mark subscription as cancelled
        await supabase
          .from("company_subscriptions")
          .update({ subscription_status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id)

        console.log("[v0] Subscription marked as cancelled")
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object
        console.log("[v0] Invoice paid:", invoice.id)

        // Update last payment info
        await supabase
          .from("company_subscriptions")
          .update({
            last_payment_date: new Date().toISOString(),
            last_payment_amount: invoice.amount_paid / 100, // Convert from cents
          })
          .eq("stripe_subscription_id", invoice.subscription as string)

        console.log("[v0] Payment info updated")
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        console.log("[v0] Payment failed:", invoice.id)

        // Mark subscription as past_due
        await supabase
          .from("company_subscriptions")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", invoice.subscription as string)

        console.log("[v0] Subscription marked as past_due")
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
