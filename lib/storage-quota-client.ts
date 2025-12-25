/**
 * Client-side Storage Quota Helpers
 * Uses API routes to check storage quotas from client components
 */

export interface StorageQuota {
  allowed: boolean
  current_gb: number
  max_gb: number
  remaining_gb: number
  usage_percentage: number
  warning_threshold: boolean
}

export interface FileUploadRecord {
  company_id: string
  file_type: "csv" | "pdf" | "attachment" | "image"
  file_name: string
  file_size_bytes: number
  file_url?: string
  uploaded_by?: string
}

/**
 * Check storage quota from client component
 */
export async function checkStorageQuota(companyId: string, fileSizeBytes: number): Promise<StorageQuota> {
  const response = await fetch("/api/storage/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, fileSizeBytes }),
  })

  if (!response.ok) {
    throw new Error("Failed to check storage quota")
  }

  return response.json()
}

/**
 * Record file upload from client component
 */
export async function recordFileUpload(record: FileUploadRecord): Promise<void> {
  const response = await fetch("/api/storage/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  })

  if (!response.ok) {
    throw new Error("Failed to record file upload")
  }
}
