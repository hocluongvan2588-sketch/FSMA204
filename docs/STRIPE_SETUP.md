# Stripe Integration Setup Guide

This guide explains how to set up and configure the Stripe integration for subscription payments.

## Environment Variables Required

Add these environment variables to your Vercel project:

\`\`\`bash
# Stripe Keys (already configured via integration)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Additional Required Variables
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=your-random-secret-string
\`\`\`

## Setup Steps

### 1. Configure Stripe Products and Prices

You need to create products and prices in your Stripe dashboard that match your service packages.

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create products for each service package (STARTER, PROFESSIONAL, ENTERPRISE)
3. For each product, create two prices:
   - Monthly recurring price
   - Yearly recurring price
4. Copy the Price IDs and update `lib/stripe-products.ts`:

\`\`\`typescript
export const STRIPE_PRODUCTS: Record<string, StripeProduct> = {
  STARTER: {
    packageCode: "STARTER",
    stripePriceIdMonthly: "price_1234567890", // Replace with actual Price ID
    stripePriceIdYearly: "price_0987654321",   // Replace with actual Price ID
  },
  // ... update other packages
}
\`\`\`

### 2. Configure Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` environment variable

### 3. Configure Vercel Cron Job

The system uses Vercel Cron to automatically update subscription statuses daily.

1. The `vercel.json` file is already configured with the cron schedule
2. Add `CRON_SECRET` environment variable (generate a random string)
3. Deploy to Vercel - the cron job will run automatically at midnight UTC

### 4. Test Payment Flow

1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future expiry date (e.g., 12/34)
3. Any 3-digit CVC (e.g., 123)
4. Test the subscription flow:
   - Create a subscription
   - Complete payment
   - Check webhook events in Stripe dashboard
   - Verify subscription created in database

## Features Implemented

### Payment Features
- 14-day free trial for all subscriptions
- Monthly and yearly billing cycles
- Stripe Checkout for secure payment collection
- Stripe Billing Portal for customers to manage subscriptions
- Automatic payment retry on failure

### Subscription Lifecycle
- Automatic trial → active transition when payment succeeds
- Automatic expiration marking via daily cron job
- Status tracking: trial, active, past_due, cancelled, expired
- Subscription alerts when expiring soon (7 days warning)

### Quota Enforcement
- Real-time quota checking before creating users/facilities/products
- Automatic usage tracking with increment/decrement
- Clear error messages when quotas exceeded
- Support for unlimited quotas (-1 value)

### Webhook Events Handled
- `checkout.session.completed` - Creates subscription in database
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.paid` - Records payment information
- `invoice.payment_failed` - Marks subscription as past_due

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is correct in Stripe dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Stripe dashboard webhook logs for delivery status

### Cron Job Not Running
- Verify `vercel.json` is in project root
- Check Vercel deployment logs for cron execution
- Ensure `CRON_SECRET` environment variable is set

### Quota Not Enforcing
- Check company has active subscription in `company_subscriptions` table
- Verify `current_*_count` fields are updating
- Run `recalculateUsage(companyId)` to sync counts if needed

### Payment Not Creating Subscription
- Check webhook events are being received
- Verify metadata (company_id, package_id) is passed in checkout session
- Check database for subscription record with matching stripe_subscription_id

## Production Checklist

Before going live with real payments:

- [ ] Switch to live Stripe keys (remove `sk_test_` and `pk_test_`)
- [ ] Update webhook endpoint to use live mode
- [ ] Test live payment flow with real card
- [ ] Configure live Stripe products and update Price IDs
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Review and test all webhook events
- [ ] Monitor Stripe dashboard for payment issues
- [ ] Set up email notifications for failed payments

## Security Notes

- Webhook signatures are verified to prevent tampering
- Cron endpoint requires authorization token
- All prices validated server-side (no client manipulation)
- Payment methods stored securely in Stripe (not in database)
- Subscription status checked via middleware before allowing access
