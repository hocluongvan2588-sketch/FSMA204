# CTE Visibility Troubleshooting Guide

## Problem
CTEs are not showing in the user interface even though seed data exists in the database.

## Root Cause Analysis

### Database Schema
\`\`\`
critical_tracking_events
├── facility_id (FK to facilities)
├── tlc_id (FK to traceability_lots)
└── NO direct company_id

facilities
├── company_id (FK to companies)
└── name

profiles
├── company_id (FK to companies)
└── role
\`\`\`

### Data Flow
To see CTEs, users must have:
1. **Profile with company_id** → User belongs to a company
2. **Company has facilities** → Company owns facilities
3. **Facilities have CTEs** → Events happened at those facilities

### RLS Policy Logic
\`\`\`sql
-- Users can see CTEs if:
facility_id IN (
  SELECT id FROM facilities 
  WHERE company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
)
\`\`\`

## Current Seed Data Status

Run script 214 to check:

\`\`\`bash
psql -f scripts/214_fix_cte_visibility_complete.sql
\`\`\`

Expected output:
- ✅ 5 companies exist
- ✅ 5 facilities exist (1 per company)
- ✅ 5 CTEs exist (1 per facility)
- ❓ Users have company_id assigned?

## Troubleshooting Steps

### Step 1: Verify User Profile
\`\`\`sql
SELECT 
  p.id,
  p.full_name,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.id = auth.uid();
\`\`\`

**Expected**: User should have `company_id` populated

**If NULL**: User is not assigned to any company
- **Fix**: Assign user to a company via admin panel or SQL update

### Step 2: Verify Company Has Facilities
\`\`\`sql
SELECT 
  f.id,
  f.name,
  f.company_id
FROM facilities f
WHERE f.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());
\`\`\`

**Expected**: At least 1 facility

**If empty**: Company has no facilities
- **Fix**: Create a facility for the company

### Step 3: Verify Facilities Have CTEs
\`\`\`sql
SELECT 
  cte.id,
  cte.event_type,
  cte.facility_id
FROM critical_tracking_events cte
WHERE cte.facility_id IN (
  SELECT f.id FROM facilities f
  WHERE f.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);
\`\`\`

**Expected**: At least 1 CTE

**If empty**: No events at company's facilities
- **Fix**: Create CTEs or run seed script 207

### Step 4: Check API Response
Open browser console and check for errors:
- ❌ `No API key found` → Environment variables issue
- ❌ `PGRST` errors → RLS policy blocking access
- ❌ `Foreign key` errors → Schema mismatch

## Quick Fix Script

If users can't see CTEs, run this to verify the complete chain:

\`\`\`sql
-- Check complete data chain for current user
SELECT 
  'Profile' as level,
  p.id::text as id,
  p.full_name as name,
  p.company_id::text as related_to
FROM profiles p
WHERE p.id = auth.uid()

UNION ALL

SELECT 
  'Company',
  c.id::text,
  c.name,
  NULL
FROM companies c
WHERE c.id = (SELECT company_id FROM profiles WHERE id = auth.uid())

UNION ALL

SELECT 
  'Facility',
  f.id::text,
  f.name,
  f.company_id::text
FROM facilities f
WHERE f.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())

UNION ALL

SELECT 
  'CTE',
  cte.id::text,
  cte.event_type,
  cte.facility_id::text
FROM critical_tracking_events cte
JOIN facilities f ON cte.facility_id = f.id
WHERE f.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());
\`\`\`

## Solution Summary

**Most likely issue**: Logged-in admin user doesn't have `company_id` assigned.

**Quick fix**: Update the admin profile to assign them to a company:
\`\`\`sql
UPDATE profiles 
SET company_id = (SELECT id FROM companies WHERE name = 'VNTEETH' LIMIT 1)
WHERE id = auth.uid();
\`\`\`

After this, refresh the page and CTEs should appear.
