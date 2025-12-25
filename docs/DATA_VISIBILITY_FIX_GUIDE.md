# Data Visibility Fix Guide

## Problem Summary

Seed data was loaded successfully into the database, but it was not visible in the admin dashboard due to:

1. **Missing Foreign Key Constraint**: `profiles.company_id` → `companies.id` foreign key did not exist, causing PostgREST error PGRST200
2. **Incomplete RLS Policies**: Row Level Security policies did not properly grant `system_admin` access to all data
3. **API Key Error**: Client-side Supabase queries were failing due to missing configuration

## Solution

Run script `211_complete_fix_data_visibility.sql` which performs:

### 1. Add Foreign Key Constraint

\`\`\`sql
ALTER TABLE profiles 
ADD CONSTRAINT profiles_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(id);
\`\`\`

This enables PostgREST to understand the relationship and support queries like:
\`\`\`typescript
.select('*, companies(name)')
\`\`\`

### 2. Fix RLS Policies

Creates comprehensive RLS policies for `system_admin` role on all tables:
- `companies` - view and manage all
- `facilities` - view and manage all  
- `products` - view and manage all
- `traceability_lots` - view and manage all
- `critical_tracking_events` - view and manage all
- `key_data_elements` - view and manage all

### 3. Helper Function

Creates `is_system_admin()` function to simplify policy checks:
\`\`\`sql
CREATE FUNCTION is_system_admin() RETURNS boolean AS $$
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

## Verification

After running the script, verify:

1. **Foreign Key exists**:
\`\`\`sql
SELECT constraint_name FROM information_schema.table_constraints
WHERE constraint_name = 'profiles_company_id_fkey';
\`\`\`

2. **Data counts**:
\`\`\`sql
SELECT 
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM facilities) as facilities,
  (SELECT COUNT(*) FROM products) as products;
\`\`\`

3. **RLS policies active**:
\`\`\`sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('companies', 'facilities', 'products')
ORDER BY tablename;
\`\`\`

4. **Test as system_admin**: Login to admin dashboard and navigate to:
   - `/admin` - Should show company stats
   - `/admin/users` - Should list all users
   - `/admin/companies` - Should list all companies

## Expected Results

After fix:
- ✅ No more PGRST200 errors
- ✅ Admin dashboard displays all data
- ✅ Companies, facilities, products visible
- ✅ System admin can manage all entities

## Troubleshooting

If data still not visible:

1. **Check if you're logged in as system_admin**:
\`\`\`sql
SELECT id, role FROM profiles WHERE id = auth.uid();
\`\`\`

2. **Verify RLS is enabled**:
\`\`\`sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'companies';
\`\`\`

3. **Test query directly**:
\`\`\`typescript
const { data, error } = await supabase
  .from('companies')
  .select('*');
console.log('Companies:', data, 'Error:', error);
