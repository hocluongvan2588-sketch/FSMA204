/**
 * Storage Quota Management - PRODUCTION READY
 *
 * BUSINESS RULES:
 * - Only USER-UPLOADED FILES count toward quota
 * - Database records (TLCs, CTEs, KDEs) do NOT count
 * - Files counted: CSV uploads, PDF exports, reference documents, attachments
 * - Hard block at 100% usage
 * - Soft warning at 80% usage
 * - Admin can override via company_subscription_overrides table
 */

import { createClient } from "@/lib/supabase/server"

export interface StorageQuota {
  allowed: boolean
  current_gb: number
  max_gb: number
  remaining_gb: number
  usage_percentage: number
  warning_threshold: boolean // true if >= 80%
}

export interface FileUploadRecord {
  company_id: string
  file_type: "csv" | "pdf" | "attachment" | "image"
  file_name: string
  file_size_bytes: number
  file_url?: string
  uploaded_by?: string
}

export interface StorageBreakdown {
  csv_files: number
  pdf_exports: number
  attachments: number
  images: number
  total: number
}

/**
 * Check if company can upload a file of given size
 * @param companyId - Company UUID
 * @param fileSizeBytes - Size of file to upload in bytes
 * @returns StorageQuota object with allowed flag
 */
export async function checkStorageQuota(companyId: string, fileSizeBytes: number): Promise<StorageQuota> {
  const supabase = await createClient()

  // Get company subscription with storage limits
  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select(
      `
      current_storage_gb,
      service_packages!inner (max_storage_gb)
    `,
    )
    .eq("company_id", companyId)
    .eq("subscription_status", "active")
    .single()

  if (!subscription || !subscription.service_packages) {
    return {
      allowed: false,
      current_gb: 0,
      max_gb: 0,
      remaining_gb: 0,
      usage_percentage: 100,
      warning_threshold: true,
    }
  }

  const currentGB = subscription.current_storage_gb || 0
  const maxGB = (subscription.service_packages as any).max_storage_gb || 0
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024)
  const newTotalGB = currentGB + fileSizeGB
  const remainingGB = Math.max(maxGB - currentGB, 0)
  const usagePercentage = maxGB > 0 ? (currentGB / maxGB) * 100 : 0

  // Check for admin overrides
  const { data: override } = await supabase
    .from("company_subscription_overrides")
    .select("overridden_limits")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .single()

  const effectiveMaxGB = override?.overridden_limits?.storage_gb || maxGB
  const allowed = newTotalGB <= effectiveMaxGB

  return {
    allowed,
    current_gb: currentGB,
    max_gb: effectiveMaxGB,
    remaining_gb: effectiveMaxGB - currentGB,
    usage_percentage: usagePercentage,
    warning_threshold: usagePercentage >= 80,
  }
}

/**
 * Record a file upload and update storage usage (AUTOMATIC via trigger)
 * @param record - File upload details
 * @returns Updated storage quota
 */
export async function recordFileUpload(record: FileUploadRecord): Promise<StorageQuota> {
  const supabase = await createClient()

  const { error } = await supabase.from("file_uploads").insert({
    company_id: record.company_id,
    file_type: record.file_type,
    file_name: record.file_name,
    file_size_bytes: record.file_size_bytes,
    file_url: record.file_url || null,
    uploaded_by: record.uploaded_by || null,
  })

  if (error) {
    console.error("[v0] Error recording file upload:", error)
    throw error
  }

  // Return updated quota
  return checkStorageQuota(record.company_id, 0)
}

/**
 * Calculate total storage used by a company
 * @param companyId - Company UUID
 * @returns Total storage in GB
 */
export async function calculateTotalStorage(companyId: string): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase.rpc("calculate_company_storage", {
    p_company_id: companyId,
  })

  return data || 0
}

/**
 * Get storage usage breakdown by file type
 * @param companyId - Company UUID
 * @returns Breakdown of storage by file type
 */
export async function getStorageBreakdown(companyId: string): Promise<StorageBreakdown> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("storage_breakdown_by_company")
    .select("file_type, storage_gb")
    .eq("company_id", companyId)

  if (error || !data) {
    return {
      csv_files: 0,
      pdf_exports: 0,
      attachments: 0,
      images: 0,
      total: 0,
    }
  }

  const breakdown: StorageBreakdown = {
    csv_files: 0,
    pdf_exports: 0,
    attachments: 0,
    images: 0,
    total: 0,
  }

  data.forEach((row: any) => {
    const gb = Number.parseFloat(row.storage_gb) || 0
    breakdown.total += gb

    switch (row.file_type) {
      case "csv":
        breakdown.csv_files = gb
        break
      case "pdf":
        breakdown.pdf_exports = gb
        break
      case "attachment":
        breakdown.attachments = gb
        break
      case "image":
        breakdown.images = gb
        break
    }
  })

  return breakdown
}

/**
 * Recalculate storage from actual files
 * Useful for fixing out-of-sync storage counts
 * @param companyId - Company UUID
 */
export async function recalculateStorage(companyId: string): Promise<void> {
  const supabase = await createClient()

  const { data: calculatedGB } = await supabase.rpc("calculate_company_storage", {
    p_company_id: companyId,
  })

  if (calculatedGB !== null) {
    await supabase
      .from("company_subscriptions")
      .update({ current_storage_gb: calculatedGB })
      .eq("company_id", companyId)
      .eq("subscription_status", "active")
  }
}

/**
 * Delete a file record and update storage
 * @param fileId - UUID of file_uploads record
 */
export async function deleteFileRecord(fileId: string): Promise<void> {
  const supabase = await createClient()

  // Deletion trigger will automatically update storage
  const { error } = await supabase.from("file_uploads").delete().eq("id", fileId)

  if (error) {
    console.error("[v0] Error deleting file record:", error)
    throw error
  }
}
