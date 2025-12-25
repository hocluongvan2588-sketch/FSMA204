# Plan Configuration Architecture - Single Source of Truth

## Architecture Overview

This document describes the plan configuration system for Vexim FSMA 204, ensuring **100% alignment** between UI, Backend, Billing, and Admin.

## Core Principle: Single Source of Truth

**Rule:** The `service_packages` table in Supabase is the ONLY source of truth for all plan configurations.

**Benefits:**
- Change price/quota → No code changes needed
- Add new feature → Just add column + seed data
- UI always renders from database
- Admin can override per company

## Data Model

### 1. service_packages (Plan Configs)

\`\`\`sql
CREATE TABLE service_packages (
  id UUID PRIMARY KEY,
  package_code TEXT UNIQUE, -- FREE, STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
  package_name TEXT,
  package_name_vi TEXT,
  price_monthly DECIMAL,
  price_yearly DECIMAL,
  
  -- Quotas (-1 = unlimited)
  max_users INTEGER,
  max_facilities INTEGER,
  max_products INTEGER,
  max_storage_gb DECIMAL,
  
  -- Features (boolean flags)
  includes_fda_management BOOLEAN,
  includes_agent_management BOOLEAN,
  includes_cte_tracking BOOLEAN,
  includes_reporting BOOLEAN,
  includes_api_access BOOLEAN,
  includes_custom_branding BOOLEAN,
  includes_priority_support BOOLEAN
);
\`\`\`

### 2. company_subscriptions (Active Subscriptions)

\`\`\`sql
CREATE TABLE company_subscriptions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  package_id UUID REFERENCES service_packages(id),
  subscription_status TEXT, -- active, expired, canceled
  
  -- Current usage (auto-updated by triggers)
  current_users_count INTEGER,
  current_facilities_count INTEGER,
  current_products_count INTEGER,
  current_storage_gb DECIMAL
);
\`\`\`

### 3. company_subscription_overrides (Admin Overrides)

\`\`\`sql
CREATE TABLE company_subscription_overrides (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  -- Overridden quotas (JSONB for flexibility)
  overridden_limits JSONB, -- {"users": 100, "facilities": 20}
  overridden_features JSONB, -- {"api_access": true, "custom_branding": true}
  
  -- Admin metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ, -- For temporary trials
  is_active BOOLEAN
);
\`\`\`

## Code Architecture

### 1. lib/plan-config.ts (Core Logic)

**Functions:**
- `getPlanConfig(packageCode)` → Get plan config from database
- `getAllPlanConfigs()` → Get all active plans (for pricing page)
- `getCompanyEffectivePlan(companyId)` → Get plan WITH overrides applied
- `hasFeatureAccess(companyId, feature)` → Check feature access
- `checkQuota(companyId, quotaType)` → Check quota limit

**Key Points:**
- All functions read from database
- Overrides are automatically applied
- NO hardcoded values

### 2. UI Rendering (app/admin/pricing/page.tsx)

\`\`\`tsx
// ✅ CORRECT: Render from database
const plans = await getAllPlanConfigs()

plans.map(plan => (
  <PricingCard>
    <Price>{plan.price_monthly}</Price>
    <Features>
      {plan.features.api_access && <Feature>API Access</Feature>}
      {plan.limits.users === -1 ? "Unlimited" : plan.limits.users} users
    </Features>
  </PricingCard>
))

// ❌ WRONG: Hardcoded
<Feature>10 users</Feature>
<Feature>API Access</Feature>
\`\`\`

### 3. Quota Checking (Middleware/Guards)

\`\`\`tsx
// Example: Check before creating user
export async function createUser(companyId: string, data: any) {
  const quota = await checkQuota(companyId, "users")
  
  if (!quota.allowed) {
    throw new Error(`Quota exceeded: ${quota.current}/${quota.limit} users`)
  }
  
  // Create user...
}
\`\`\`

### 4. Feature Gating

\`\`\`tsx
// Example: Check API access
export async function GET(req: Request) {
  const { companyId } = await getSession()
  
  const hasAccess = await hasFeatureAccess(companyId, "api_access")
  if (!hasAccess) {
    return new Response("Upgrade to Business plan for API access", { status: 403 })
  }
  
  // Serve API...
}
\`\`\`

## Admin Override Workflow

### Scenario: Sales wants to give trial API access

1. System admin goes to `/admin/subscription-overrides`
2. Selects company "ABC Corp" (on PROFESSIONAL plan)
3. Clicks "Create Override"
4. Sets:
   - `overridden_features`: `{"api_access": true}`
   - `expires_at`: 2025-01-31
   - `notes`: "30-day API trial for proof-of-concept"
5. Saves

**Result:**
- ABC Corp immediately gets API access
- Override expires automatically on 2025-01-31
- All logged in `subscription_override_audit_logs`
- No code changes needed!

## Checklist for Developers

When adding a new feature or changing pricing:

- [ ] Add column to `service_packages` table (if new feature)
- [ ] Update seed script `scripts/001-seed-service-packages.sql`
- [ ] Update `lib/plan-config.ts` interfaces if needed
- [ ] Run migration: `npm run db:push`
- [ ] UI will automatically render new feature (no code change needed!)

## FAQ

**Q: Can I add a "Support SLA" feature without changing code?**
A: Yes! Add `includes_support_sla BOOLEAN` column, seed data, and UI renders it.

**Q: Sales wants to give Company X 200 users instead of 20. How?**
A: Create override with `{"users": 200}`. No code change.

**Q: How do I change STARTER price from $99 to $149?**
A: Update seed script, re-run it. Pricing page updates automatically.

**Q: What if Stripe and database pricing mismatch?**
A: Stripe holds billing info, database holds permissions. System always checks database.

## Migration Guide

If you're refactoring an existing codebase:

1. **Audit hardcoded values**: Search for hardcoded "99", "10 users", etc.
2. **Create plan-config.ts**: Centralize all plan logic
3. **Update UI components**: Replace hardcoded values with database reads
4. **Add override table**: Enable admin flexibility
5. **Test quota enforcement**: Ensure limits are actually enforced
6. **Deploy**: Zero downtime (database changes are backward compatible)

---

**Remember:** If you can't change pricing by editing the database alone, your architecture is wrong.
