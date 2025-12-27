# Database Migration Guide - Vexim Global FSMA 204

## Overview
Hệ thống database đã được consolidate thành **1 MASTER MIGRATION SCRIPT DUY NHẤT**.

## Quick Start - Deploy to New Server

### Option 1: Fresh Installation (Recommended)
\`\`\`bash
# Run master migration script
psql -U postgres -d your_database < scripts/000_MASTER_MIGRATION_COMPLETE.sql

# Seed service packages
psql -U postgres -d your_database < scripts/001-seed-service-packages.sql
\`\`\`

### Option 2: Via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `scripts/000_MASTER_MIGRATION_COMPLETE.sql`
3. Click "Run"
4. Copy content from `scripts/001-seed-service-packages.sql`
5. Click "Run"

## What's Included in Master Migration

### 29 Tables
1. **Core Business**: companies, facilities, products, traceability_lots
2. **FSMA Compliance**: critical_tracking_events, key_data_elements, kde_requirements
3. **FDA Management**: fda_registrations, us_agents, facility_update_requests
4. **Subscriptions**: service_packages, company_subscriptions, company_subscription_overrides
5. **Payments & Invoices**: payment_transactions, invoices, invoice_items
6. **Traceability**: transformation_inputs, transformation_mappings, shipments
7. **Data Quality**: data_quality_alerts, audit_reports, reference_documents
8. **User Management**: profiles
9. **Logging**: audit_logs, system_logs, subscription_audit_logs, subscription_override_audit_logs
10. **Notifications**: notification_queue, file_uploads

### 3 Views
- company_complete_info
- company_storage_summary
- storage_breakdown_by_company

### 3 Functions
- generate_invoice_number()
- create_invoice_from_transaction(transaction_id)
- calculate_realtime_compliance_score(company_id)

### 80+ RLS Policies
- System admin can see all data
- Company admins see only their company data
- Operators have limited access based on allowed_cte_types

### 50+ Indexes
- Optimized for common queries
- Foreign key indexes
- Status and date range indexes

### Auto-update Triggers
- All tables have updated_at triggers

## Verification Queries

\`\`\`sql
-- Check all tables created
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check service packages
SELECT package_code, package_name, price_monthly, price_yearly
FROM service_packages
ORDER BY sort_order;
\`\`\`

## Troubleshooting

### Error: Extension "uuid-ossp" not found
\`\`\`sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\`\`\`

### Error: Extension "pgcrypto" not found
\`\`\`sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\`\`\`

### RLS Blocking Queries
\`\`\`sql
-- Temporarily disable RLS for debugging (NOT for production!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Re-enable after debugging
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
\`\`\`

## Migration from Old Scripts

If you currently have a database with old migration scripts (001-100+), you DON'T need to run them anymore.

**The master migration replaces ALL old scripts.**

To migrate:
1. Export your data
2. Drop old database
3. Run master migration
4. Import data back

## Environment Variables Needed

\`\`\`env
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# VNPay (for Vietnamese payments)
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Email (optional)
RESEND_API_KEY=re_...
\`\`\`

## Support

For issues or questions:
- Check `docs/EMAIL_SYSTEM.md` for email setup
- Check `docs/PAYMENT_SYSTEM.md` for payment setup
- Contact: support@vexim.global
