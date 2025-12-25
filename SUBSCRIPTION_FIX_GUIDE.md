# FREE Subscription Fix Guide

## Problem
Users are seeing "Gói dịch vụ đã hết hạn" (Service expired) even though they should have a FREE plan.

## Root Causes Identified

1. **Subscription Status**: Some FREE subscriptions were created with `subscription_status = 'trial'` instead of `'active'`
2. **Missing current_price**: The `current_price` column is NOT NULL but wasn't being set during company creation
3. **Query Bug**: Subscription page used `.single()` which throws errors when no subscription exists
4. **End Date**: FREE subscriptions should have a far-future end_date (100 years)

## Solution Steps

### Step 1: Run the Fix Script
\`\`\`bash
# In Supabase SQL Editor or via CLI
psql $DATABASE_URL < scripts/052_fix_free_subscriptions.sql
\`\`\`

This script will:
- Fix all FREE subscriptions to have `subscription_status = 'active'`
- Set `current_price = 0` for all FREE plans
- Create FREE subscriptions for companies that don't have any
- Set end_date to 100 years in the future

### Step 2: Verify in Code
The code has been updated with these fixes:

**app/actions/admin-users.ts** (createCompany function):
- ✅ Now sets `subscription_status: "active"`
- ✅ Sets `current_price: 0` from package config
- ✅ Sets `end_date` to 100 years in future
- ✅ Better error handling and logging

**app/admin/my-subscription/page.tsx**:
- ✅ Changed `.single()` to `.maybeSingle()` to avoid errors
- ✅ Shows "Miễn phí mãi mãi" for FREE plans instead of expiry date
- ✅ Checks for both 'active' and 'trial' status subscriptions
- ✅ Better fallback when no active subscription exists

**app/admin/pricing/page.tsx**:
- ✅ Properly detects current plan
- ✅ Shows "Gói hiện tại" badge on current plan card
- ✅ Disables button for current plan

### Step 3: Test the Flow

1. **Create a new company** (system admin only):
   \`\`\`
   POST /api/admin/companies
   \`\`\`
   - Check console logs for "[v0] FREE subscription created successfully"
   - Verify in database that subscription_status = 'active'

2. **Check subscription page**:
   - Navigate to `/admin/my-subscription`
   - Should show FREE plan as "Đang hoạt động" (Active)
   - End date should show "Miễn phí mãi mãi"

3. **Check pricing page**:
   - Navigate to `/admin/pricing`
   - FREE plan card should have green border
   - Should show "Gói hiện tại" badge
   - Button should be disabled and say "Gói hiện tại"

### Step 4: Monitor Logs

When creating a company, you should see these console logs:
\`\`\`
[v0] Company created: <uuid>
[v0] Attempting to create FREE subscription for new company
[v0] FREE package found: { id: '...', package_code: 'FREE', package_name: 'Free Plan', monthly_price_usd: 0 }
[v0] FREE subscription created successfully: [{ id: '...', subscription_status: 'active', ... }]
\`\`\`

## Database Schema Reference

\`\`\`sql
-- company_subscriptions table
subscription_status TEXT NOT NULL DEFAULT 'trial', -- Options: 'trial', 'active', 'past_due', 'cancelled', 'expired'
current_price DECIMAL(10, 2) NOT NULL,            -- REQUIRED: Must be set (0 for FREE)
start_date DATE NOT NULL DEFAULT CURRENT_DATE,
end_date DATE,                                     -- NULL or far-future for FREE plans
\`\`\`

## Common Issues

### Issue 1: "Gói dịch vụ đã hết hạn" still showing
**Cause**: Old subscriptions with status 'trial' or 'expired'
**Fix**: Run `scripts/052_fix_free_subscriptions.sql`

### Issue 2: "Không tìm thấy người dùng" on user detail page
**Cause**: Next.js 15+ requires `await params` in API routes
**Fix**: Already fixed in `app/api/admin/users/[id]/route.ts`

### Issue 3: FREE plan not assigned on company creation
**Cause**: FREE package doesn't exist in database
**Fix**: Run `scripts/001-seed-service-packages.sql`

### Issue 4: Pricing page doesn't show current plan
**Cause**: Query only checks for 'active' status, but subscription might be 'trial'
**Fix**: Already fixed in `app/admin/pricing/page.tsx` to use `.maybeSingle()`

## Verification Queries

Check if FREE package exists:
\`\`\`sql
SELECT id, package_code, package_name, is_active, monthly_price_usd 
FROM service_packages 
WHERE package_code = 'FREE';
\`\`\`

Check FREE subscriptions:
\`\`\`sql
SELECT 
  c.name as company_name,
  cs.subscription_status,
  cs.current_price,
  cs.start_date,
  cs.end_date,
  sp.package_name
FROM company_subscriptions cs
JOIN companies c ON cs.company_id = c.id
JOIN service_packages sp ON cs.package_id = sp.id
WHERE sp.package_code = 'FREE';
\`\`\`

Check companies without subscriptions:
\`\`\`sql
SELECT c.id, c.name
FROM companies c
LEFT JOIN company_subscriptions cs ON c.id = cs.company_id
WHERE cs.id IS NULL;
\`\`\`

## Success Criteria

✅ All companies have at least one subscription (FREE by default)
✅ FREE subscriptions have `subscription_status = 'active'`
✅ FREE subscriptions have `current_price = 0`
✅ FREE subscriptions have `end_date` far in future (or NULL)
✅ Subscription page shows FREE plan as "Đang hoạt động"
✅ Pricing page shows "Gói hiện tại" on FREE plan card
✅ No "Gói dịch vụ đã hết hạn" errors for FREE users
