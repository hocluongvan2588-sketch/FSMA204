# Security Fixes - Data Isolation Between Companies

## Critical Security Issues Fixed

### 1. Data Leakage Between Companies (CRITICAL)
**Problem**: Company admins could see user statistics and data from ALL companies in the system, not just their own.

**Root Cause**: 
- Queries in `app/admin/page.tsx` and `app/admin/users/page.tsx` were not filtered by `company_id`
- RLS policies were enabled but application code was not properly scoped

**Fix Applied**:
- Added company filter to all statistics queries for non-system admins
- System admins continue to see all data (intended behavior)
- Company admins now only see:
  - Users from their own company
  - Facilities from their own company
  - Logs related to their own company
  - Their own company information

**Files Changed**:
- `app/admin/page.tsx` - Added company filtering to all stat queries
- `app/actions/admin-users.ts` - Enhanced security checks

### 2. Missing Company Display Name
**Problem**: When system admin creates a user and enters a company name, it was not saved to the `display_name` field.

**Root Cause**: 
- Code existed to update `display_name` but it was not being called correctly
- Company name from system admin was lost

**Fix Applied**:
- Enhanced `createUser` function to properly save `companyName` to `companies.display_name`
- Added logging to track when display name is updated
- Company admins can now see this display name in their company page

**Files Changed**:
- `app/actions/admin-users.ts` - Added display_name update logic
- `app/admin/my-company/page.tsx` - Already shows display_name (no changes needed)

### 3. Additional Security Enhancements
**Implemented**:
- Company admins cannot create system_admin or admin users (security escalation prevention)
- Company admins cannot delete other admins or system admins
- Company admins can only manage users within their own company
- Enhanced validation checks before user creation/deletion

## Verification Steps

### Test 1: Data Isolation
1. Login as company admin for Company A
2. Go to `/admin` dashboard
3. Verify you only see statistics for Company A users
4. Check Recent Users - should only show Company A users

### Test 2: Company Display Name
1. Login as system admin
2. Create a new user and select a company
3. Enter a company name in the "Tên công ty" field
4. Logout system admin
5. Login as the newly created user (if they are admin)
6. Go to `/admin/my-company`
7. Verify "Tên hiển thị (Đặt bởi System Admin)" shows the name entered by system admin

### Test 3: Cross-Company Operations (Should Fail)
1. Login as company admin for Company A
2. Try to view/edit users from Company B (should be blocked by RLS)
3. Try to create admin/system_admin users (should show error)
4. Try to delete another admin user (should show error)

## Database Schema

### Companies Table
- `name`: Company's registered business name (editable by company admin)
- `display_name`: Display name set by system admin (read-only for company admin)

### Profiles Table  
- `company_id`: Links user to their company
- `role`: User's role (system_admin, admin, manager, operator, viewer)

## RLS Policies Status

All tables now have RLS enabled:
- ✅ profiles (8 policies)
- ✅ companies (4 policies)
- ✅ facilities (3 policies)
- ✅ products (2 policies)
- ✅ All other tables have appropriate RLS policies

## Security Best Practices Implemented

1. **Principle of Least Privilege**: Users can only access data they need
2. **Defense in Depth**: RLS at database + application-level checks
3. **Audit Trail**: All actions logged in system_logs table
4. **Input Validation**: Server-side validation of all user inputs
5. **Role-Based Access Control**: Clear separation between system admin and company admin

## Testing Checklist

- [ ] System admin can see all companies and users
- [ ] Company admin can only see their own company's data
- [ ] Company admin cannot create admin/system_admin users
- [ ] Company admin cannot delete admin users
- [ ] Display name is saved when system admin creates user with company name
- [ ] Company admin can see display name in My Company page
- [ ] RLS policies prevent direct database access to other companies' data
- [ ] All statistics are properly scoped by company
