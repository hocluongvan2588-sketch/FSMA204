-- Add Stripe-related fields to companies and subscriptions tables

-- Add stripe_customer_id to companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe fields to company_subscriptions
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer 
ON companies(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe 
ON company_subscriptions(stripe_subscription_id);

-- Add NEXT_PUBLIC_APP_URL comment
COMMENT ON DATABASE postgres IS 'Remember to set NEXT_PUBLIC_APP_URL and STRIPE_WEBHOOK_SECRET environment variables';
