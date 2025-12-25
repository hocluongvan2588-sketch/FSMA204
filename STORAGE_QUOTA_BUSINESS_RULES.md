# Storage Quota Business Rules - FSMA 204 Compliance System

## Executive Summary

This document defines the **Single Source of Truth** for Storage (GB) quota management across the FSMA 204 Compliance Platform. All teams (Sales, Support, Engineering, Product) must follow these rules for consistency.

---

## 1️⃣ What Counts Toward Storage Quota?

### Current Implementation Analysis

Based on code audit, the system currently tracks:

#### **Counted in Storage Quota:**
❌ **NONE - Storage tracking is NOT implemented**

#### **NOT Counted (But Should Be):**
- ❌ CSV file uploads (bulk import of facilities, products, lots)
- ❌ PDF exports (traceability reports, compliance documents)
- ❌ Reference document attachments (invoices, BOL, packing slips, certificates)
- ❌ QR code images generated
- ❌ Database records (TLCs, CTEs, KDEs, Facilities, Products)

### ⚠️ Critical Finding

The `current_storage_gb` field in `company_subscriptions` table exists but is:
- **Never automatically calculated**
- **Never incremented when files are uploaded**
- **Only manually updated via `updateStorageUsage()` function**
- **No file upload tracking system exists**

### Storage Schema (Current)

\`\`\`sql
-- Table: company_subscriptions
current_storage_gb DECIMAL(10, 2) DEFAULT 0  -- Manual field, not auto-calculated

-- Table: reference_documents  
file_url TEXT  -- Optional URL to document, but no file size tracking
\`\`\`

---

## 2️⃣ Proposed Storage Quota Rules

### What SHOULD Count

| Item Type | Size Calculation | Auto-tracked? |
|-----------|------------------|---------------|
| **CSV Uploads** | Actual file size | ✅ Yes |
| **PDF Exports** | Generated PDF size | ✅ Yes |
| **Reference Documents** | Uploaded file size | ✅ Yes |
| **QR Codes** | Generated image size | ❌ No (negligible) |
| **Database Records** | ❌ No (covered by infrastructure) | N/A |

### Database Records - NOT Counted

TLCs, CTEs, KDEs, Facilities, Products, and Users do NOT count toward storage quota because:
- Database storage is infrastructure-level
- Quota is for **user-generated file content**
- Prevents complex billing calculations

---

## 3️⃣ Storage Calculation Method

### Recommended Implementation

\`\`\`typescript
// When file is uploaded
const fileSizeInBytes = uploadedFile.size
const fileSizeInGB = fileSizeInBytes / (1024 * 1024 * 1024)

// Update company storage
await updateStorageUsage(companyId, currentStorageGB + fileSizeInGB)
\`\`\`

### Compression & Cleanup

**Automatic Compression:** ❌ Not implemented
- **Recommendation:** Enable for PDFs over 5MB

**Auto-delete old files:** ❌ Not implemented  
- **Recommendation:** Archive files older than 2 years to cold storage (doesn't count toward quota)

---

## 4️⃣ When Storage Quota is Exceeded

### Current Behavior
⚠️ **NO ENFORCEMENT** - System doesn't check storage before upload

### Proposed Behavior

#### Hard Limits (BLOCK Actions)
\`\`\`typescript
if (currentStorage + newFileSize > maxStorageGB) {
  throw new Error("Storage quota exceeded. Please upgrade your plan.")
}
\`\`\`

**Actions Blocked:**
- ✅ New file uploads (CSV, PDF attachments)
- ✅ PDF report generation
- ✅ Reference document attachments

**Actions NOT Blocked:**
- ✅ Viewing existing data
- ✅ Adding database records (TLCs, CTEs, KDEs)
- ✅ Generating QR codes (negligible size)

#### Soft Warnings (at 80% usage)
\`\`\`typescript
if (currentStorage / maxStorageGB >= 0.8) {
  showWarning("You've used 80% of your storage. Consider upgrading.")
}
\`\`\`

### Admin Override
✅ **System Admin CAN override** storage limits via `company_subscription_overrides` table

\`\`\`sql
INSERT INTO company_subscription_overrides (
  company_id,
  overridden_limits,
  notes
) VALUES (
  'company-uuid',
  '{"storage_gb": 200}',  -- Override to 200GB
  'Customer requested temporary increase during migration'
);
\`\`\`

---

## 5️⃣ Pricing Page Display Rules

### Storage Display Format

\`\`\`
FREE: 0.1 GB dung lượng
STARTER: 5 GB dung lượng  
PROFESSIONAL: 20 GB dung lượng
BUSINESS: 100 GB dung lượng
ENTERPRISE: 500 GB dung lượng
\`\`\`

### What Users Get

- **Files:** CSV uploads, PDF exports, attachments
- **Does NOT include:** Database records, system logs
- **Counted:** Individual file sizes summed to total GB

---

## 6️⃣ Implementation Checklist

### Phase 1: File Tracking (Critical)
- [ ] Add `file_size_bytes BIGINT` to `reference_documents` table
- [ ] Create `file_uploads` table to track all uploaded files
- [ ] Implement file size calculation on upload
- [ ] Update `current_storage_gb` automatically

### Phase 2: Quota Enforcement (High Priority)
- [ ] Add pre-upload storage check in API routes
- [ ] Block uploads when quota exceeded
- [ ] Show storage usage in dashboard (progress bar)
- [ ] Send email alerts at 80%, 90%, 100% usage

### Phase 3: Optimization (Medium Priority)
- [ ] Implement PDF compression for large files
- [ ] Add file cleanup/archival for old documents
- [ ] Enable admin bulk deletion of files

### Phase 4: Reporting (Low Priority)
- [ ] Storage usage analytics by file type
- [ ] Storage usage trends over time
- [ ] File size distribution charts

---

## 7️⃣ Support & Sales Alignment

### For Sales Team
**When customers ask: "What counts as storage?"**

> Storage quota covers all files you upload or generate:
> - CSV files for bulk data import
> - PDF exports of compliance reports  
> - Reference documents (invoices, BOL, certificates)
> 
> Database records (products, lots, tracking events) do NOT count - only files do.

### For Support Team
**When customers report "storage full":**

1. Check current usage: `/admin/my-subscription`
2. Verify with: `GET /api/subscription-recalculate`
3. If legitimate, offer:
   - Plan upgrade
   - File cleanup assistance
   - Temporary admin override (if justified)

### For Engineering Team
**Before launching storage enforcement:**

1. Audit all file upload endpoints
2. Add storage checks to:
   - `/api/upload/*`
   - PDF generation routes
   - CSV import routes
3. Test quota blocking behavior
4. Deploy with feature flag

---

## 8️⃣ Database Schema Changes Needed

\`\`\`sql
-- Add file size tracking
ALTER TABLE reference_documents 
ADD COLUMN file_size_bytes BIGINT DEFAULT 0,
ADD COLUMN storage_counted BOOLEAN DEFAULT true;

-- Create file uploads audit table
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  file_type TEXT NOT NULL, -- 'csv', 'pdf', 'attachment'
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to calculate total storage
CREATE OR REPLACE FUNCTION calculate_company_storage(p_company_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(file_size_bytes) / 1073741824.0, 0)
  FROM file_uploads
  WHERE company_id = p_company_id;
$$ LANGUAGE SQL;

-- Trigger to update storage on file upload
CREATE OR REPLACE FUNCTION update_storage_on_upload()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE company_subscriptions
  SET current_storage_gb = calculate_company_storage(NEW.company_id)
  WHERE company_id = NEW.company_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_storage
  AFTER INSERT ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_on_upload();
\`\`\`

---

## 9️⃣ API Endpoints Needed

\`\`\`typescript
// Check storage quota before upload
POST /api/storage/check-quota
Body: { companyId: string, fileSize: number }
Response: { allowed: boolean, current: number, limit: number, remaining: number }

// Upload file with quota check
POST /api/storage/upload
Body: FormData (file)
Response: { fileUrl: string, fileSize: number, storageUsed: number }

// Get storage usage breakdown
GET /api/storage/usage/:companyId
Response: {
  total_gb: number,
  breakdown: {
    csv_files: number,
    pdf_exports: number,
    attachments: number
  }
}

// Admin: Cleanup old files
DELETE /api/admin/storage/cleanup/:companyId
Query: { olderThan: '2024-01-01' }
Response: { deletedFiles: number, freedSpace: number }
\`\`\`

---

## 🎯 Success Criteria

### System Consistency
✅ Storage quota matches across:
- Pricing page display
- Database `service_packages.max_storage_gb`
- Dashboard usage display
- API quota enforcement
- Sales documentation
- Support knowledge base

### User Experience
✅ Clear messaging when quota exceeded
✅ Proactive warnings at 80% usage
✅ Easy upgrade path
✅ Transparent usage breakdown

### Business Alignment
✅ Sales can accurately quote storage limits
✅ Support can troubleshoot storage issues
✅ Engineering has automated enforcement
✅ Product has usage analytics

---

**Document Owner:** Engineering Team  
**Last Updated:** 2025-01-24  
**Next Review:** 2025-04-01  
**Status:** ⚠️ Draft - Pending Implementation
