# FoodTrace FSMA 204 - Clean Install Guide

## Overview

This directory contains **3 consolidated SQL scripts** for a complete, idempotent database setup:

1. **`001_SCHEMA_COMPLETE.sql`** - All 29 tables, indexes, triggers, and RLS policies
2. **`002_SEED_DATA_IDEMPOTENT.sql`** - Demo data for 5 organizations (Farm, Packing House, Processor, Distributor, Importer)
3. **`003_VALIDATION_AND_COMPLIANCE_TESTS.sql`** - 20 comprehensive validation tests

**Key Features:**
- ✅ Single consolidated schema file (no fragmentation)
- ✅ Idempotent seed data (safe to run multiple times)
- ✅ Complete FSMA 204 compliance validation
- ✅ All required KDE fields populated for Harvest events
- ✅ No trigger/constraint permission issues
- ✅ Proper dependency ordering
- ✅ Comprehensive audit trail

---

## Installation Steps (Fresh Database)

### Step 1: Create Schema
```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f scripts/001_SCHEMA_COMPLETE.sql
```

**What happens:**
- Creates all 29 tables with proper constraints
- Sets up 30+ indexes for performance
- Defines 7+ triggers for data integrity
- Enables RLS on all tables
- Initializes KDE validation functions

**Expected output:** No errors, just schema creation messages

---

### Step 2: Load Seed Data
```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f scripts/002_SEED_DATA_IDEMPOTENT.sql
```

**What happens:**
- Seeds 5 demo companies (organization types)
- Creates 5 facilities with GPS coordinates and location codes
- Seeds 3 service packages (Basic, Professional, Enterprise)
- Creates 6 sample traceability lots
- Generates 8 critical tracking events with proper KDEs
- Links shipments and transformation events

**Expected output:**
```
Companies: 5 records
Service Packages: 3 records
Facilities: 5 records
Traceability Lots: 8 records
Critical Tracking Events: 8 records
Key Data Elements: 13 records
Shipments: 3 records
...
```

---

### Step 3: Run Validation Tests
```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f scripts/003_VALIDATION_AND_COMPLIANCE_TESTS.sql
```

**What happens:**
- Runs 20 validation tests
- Verifies schema integrity
- Confirms FSMA 204 compliance
- Tests idempotency
- Validates relationships and constraints
- Generates data quality report

**Expected output:**
```
TEST 1 PASSED: All 29 tables exist
TEST 2 PASSED: All critical columns present
TEST 3 PASSED: Found XX unique constraints
TEST 4 PASSED: Found XX foreign key constraints
TEST 5 PASSED: Found XX performance indexes
TEST 6 PASSED: Found XX triggers
TEST 7 PASSED: All 5 demo companies seeded
TEST 8 PASSED: All 5 facility types represented
TEST 9 PASSED: FSMA 204 Compliance - All X Harvest events have GPS and location code
...
TEST 20 PASSED: Data quality report generated
```

If you see all "PASSED", the database is ready!

---

## Re-running Seeds (Idempotency Test)

To test idempotency, run Step 2 again:

```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE -f scripts/002_SEED_DATA_IDEMPOTENT.sql
```

**Expected behavior:**
- All inserts complete without errors
- No duplicate key violations
- Record counts remain the same
- Verification queries return identical results

This proves the script is safe to run multiple times.

---

## Database Structure

### Organization Hierarchy
```
Company (5 types)
├── Farm (VNTEETH)
├── Packing House (Viet Fresh)
├── Processor (Asia Process)
├── Distributor (Global Dist)
└── Importer (Import Vietnam)
    │
    ├── Facilities (5 total)
    │   ├── GPS Coordinates (FSMA 204 required)
    │   ├── Location Code (FSMA 204 required)
    │   └── FDA Registration
    │
    ├── Products (6 total)
    │   └── Traceability Lots (8 total)
    │       └── Critical Tracking Events (8 total)
    │           └── Key Data Elements (13 total)
    │
    ├── Subscriptions (5 active)
    │   └── Service Packages (3 types)
    │
    └── Users & Profiles (8 total)
        ├── Admins
        ├── Managers
        └── Operators
```

---

## FSMA 204 Compliance Verification

### Required KDE Fields Present
The seed data includes all mandatory Key Data Elements for FSMA 204:

**For Harvest Events:**
- ✅ `gps_coordinates` - Farm location
- ✅ `location_code` - Field/block identifier
- ✅ `harvest_date` - Date of harvest
- ✅ `harvest_person` - Responsible person

**For Receive Events:**
- ✅ `received_date` - Receipt timestamp
- ✅ `received_quantity` - Quantity received
- ✅ `temperature_reading` - Optional sensor data

**For Transform Events:**
- ✅ `transform_ratio` - Yield percentage
- ✅ `storage_location` - Where processed product stored

**For Shipment Events:**
- ✅ `shipment_date` - Transport start time
- ✅ `destination` - Where product going

### Trigger Validation
The `validate_harvest_kdes_trigger` ensures:
- Every Harvest CTE has GPS coordinates
- Every Harvest CTE has location code
- Invalid data is rejected at database level

Test query:
```sql
SELECT 
    cte.event_type,
    COUNT(*) as total_events,
    COUNT(DISTINCT CASE WHEN kde.kde_type = 'gps_coordinates' THEN kde.id END) as with_gps,
    COUNT(DISTINCT CASE WHEN kde.kde_type = 'location_code' THEN kde.id END) as with_location
FROM critical_tracking_events cte
LEFT JOIN key_data_elements kde ON cte.id = kde.cte_id
GROUP BY cte.event_type;
```

Expected result:
```
event_type | total_events | with_gps | with_location
Harvest    |            1 |        1 |             1
Receive    |            3 |        0 |             0
Transform  |            1 |        0 |             0
...
```

---

## Data Model Changes & Idempotency

### Why Idempotent?

Every INSERT statement uses `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`:

```sql
INSERT INTO service_packages (...) VALUES (...)
ON CONFLICT (package_code) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  updated_at = CURRENT_TIMESTAMP;
```

**Benefit:** Running the seed script twice = same result (no duplicates, no errors)

### Dependency Order (Maintained)

Scripts respect this order:
1. Service Packages (no dependencies)
2. Companies (uses service packages via foreign key)
3. Subscriptions (uses companies + packages)
4. Facilities (uses companies)
5. FDA Registrations (uses facilities + agents)
6. US Agents (uses companies)
7. Products (uses companies)
8. Traceability Lots (uses facilities + products)
9. CTEs (uses facilities + lots)
10. KDEs (uses CTEs)
11. Shipments (uses facilities + lots)
12. Transformation Inputs (uses CTEs + lots)
13. Profiles (uses companies)

---

## Troubleshooting

### Error: "relation does not exist"
**Cause:** Schema script not run first
**Solution:** Run `001_SCHEMA_COMPLETE.sql` before seed data

### Error: "duplicate key value violates unique constraint"
**Cause:** Data already exists and ON CONFLICT failed
**Solution:** Clean database and restart, or check if UNIQUE constraint changed

### Error: "foreign key constraint violated"
**Cause:** Dependency order issue
**Solution:** Ensure scripts run in correct order (001 → 002 → 003)

### Error: "trigger does not exist"
**Cause:** Trigger wasn't created in schema
**Solution:** Verify `001_SCHEMA_COMPLETE.sql` completed successfully

### Harvest events missing KDEs
**Cause:** Trigger validation prevented insert
**Solution:** Verify all Harvest events in `002_SEED_DATA_IDEMPOTENT.sql` have gps_coordinates and location_code

---

## Performance Notes

### Indexes
All critical columns are indexed for fast queries:
- `companies.registration_number` - Company lookup
- `facilities.fda_facility_number` - FDA search
- `products.product_code` - Product search
- `traceability_lots.tlc` - Lot code search
- `critical_tracking_events.event_type` - Event filtering
- And 20+ more for optimal performance

### Query Examples
```sql
-- Find all harvest events for a facility
SELECT * FROM critical_tracking_events
WHERE facility_id = 'xxx' AND event_type = 'Harvest'
ORDER BY event_date DESC;

-- Get complete traceability chain for a lot
SELECT tlc, quantity, production_date, status
FROM traceability_lots
WHERE tlc = 'TLC-xxx';

-- Check FSMA 204 compliance for company
SELECT facility_id, event_type, COUNT(distinct kde.id) as kde_count
FROM critical_tracking_events cte
LEFT JOIN key_data_elements kde ON cte.id = kde.cte_id
WHERE cte.facility_id IN (SELECT id FROM facilities WHERE company_id = 'xxx')
GROUP BY cte.facility_id, event_type;
```

---

## Maintenance & Updates

### Adding New Demo Data
1. Maintain same structure as `002_SEED_DATA_IDEMPOTENT.sql`
2. Use `ON CONFLICT` clauses
3. Update verification queries
4. Test with `003_VALIDATION_AND_COMPLIANCE_TESTS.sql`

### Schema Changes
1. Update `001_SCHEMA_COMPLETE.sql`
2. Create migration script if needed
3. Do NOT create scripts 902, 903, etc. - maintain single consolidated files

### Archiving Old Scripts
Old scripts (099-901) should be moved to `scripts/deprecated/` directory for reference only.

---

## Support & Questions

For issues:
1. Check error message against troubleshooting section
2. Run `003_VALIDATION_AND_COMPLIANCE_TESTS.sql` to get diagnostics
3. Verify all 3 scripts completed successfully
4. Check database connection strings and permissions

---

**Last Updated:** 2024-12-25
**Schema Version:** 1.0
**FSMA 204 Compliance:** ✅ Full
**Status:** Production Ready
