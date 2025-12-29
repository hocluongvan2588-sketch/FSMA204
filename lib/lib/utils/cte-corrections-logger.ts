/**
 * FSMA 204 Compliant CTE Corrections Audit Logger
 * Logs all CTE corrections with full audit trail
 */

import { createClient } from "@/lib/supabase/server"

export interface CTECorrectionLog {
  cteId: string
  correctedCteId?: string
  correctionType: "data_correction" | "event_cancellation" | "quantity_adjustment"
  correctionReason: string
  oldValues: Record<string, any>
  newValues: Record<string, any>
  changedFields: string[]
  isCritical?: boolean
  metadata?: Record<string, any>
}

export interface CTECorrectionHistory {
  id: string
  cteId: string
  correctionType: string
  correctionReason: string
  correctedBy: string
  correctedByName: string
  correctedAt: string
  changedFields: string[]
  oldValues: Record<string, any>
  newValues: Record<string, any>
  approvedBy?: string
  approvedByName?: string
  approvedAt?: string
  isCritical: boolean
}

/**
 * Log a CTE correction to audit trail
 */
export async function logCTECorrection(correction: CTECorrectionLog): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Insert correction log
  const { error: insertError } = await supabase.from("cte_corrections_audit").insert({
    cte_id: correction.cteId,
    corrected_cte_id: correction.correctedCteId,
    correction_type: correction.correctionType,
    correction_reason: correction.correctionReason,
    old_values: correction.oldValues,
    new_values: correction.newValues,
    changed_fields: correction.changedFields,
    corrected_by: user.id,
    is_critical: correction.isCritical ?? false,
    metadata: correction.metadata,
  })

  if (insertError) {
    console.error("[v0] Failed to log CTE correction:", insertError)
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

/**
 * Get correction history for a CTE
 */
export async function getCTECorrectionHistory(cteId: string): Promise<CTECorrectionHistory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("cte_corrections_audit")
    .select(
      `
      id,
      cte_id,
      correction_type,
      correction_reason,
      corrected_by,
      created_at,
      changed_fields,
      old_values,
      new_values,
      approved_by,
      approved_at,
      is_critical,
      corrector:profiles!cte_corrections_audit_corrected_by_fkey(full_name),
      approver:profiles!cte_corrections_audit_approved_by_fkey(full_name)
    `,
    )
    .eq("cte_id", cteId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Failed to fetch CTE correction history:", error)
    return []
  }

  return (data || []).map((record: any) => ({
    id: record.id,
    cteId: record.cte_id,
    correctionType: record.correction_type,
    correctionReason: record.correction_reason,
    correctedBy: record.corrected_by,
    correctedByName: record.corrector?.full_name || "Unknown",
    correctedAt: record.created_at,
    changedFields: record.changed_fields,
    oldValues: record.old_values,
    newValues: record.new_values,
    approvedBy: record.approved_by,
    approvedByName: record.approver?.full_name,
    approvedAt: record.approved_at,
    isCritical: record.is_critical,
  }))
}

/**
 * Detect what fields changed between old and new CTE
 */
export function detectChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
): { changedFields: string[]; oldValues: Record<string, any>; newValues: Record<string, any> } {
  const changedFields: string[] = []
  const filteredOldValues: Record<string, any> = {}
  const filteredNewValues: Record<string, any> = {}

  for (const key of Object.keys(newValues)) {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedFields.push(key)
      filteredOldValues[key] = oldValues[key]
      filteredNewValues[key] = newValues[key]
    }
  }

  return {
    changedFields,
    oldValues: filteredOldValues,
    newValues: filteredNewValues,
  }
}

/**
 * Determine if correction is critical (requires approval)
 */
export function isCriticalCorrection(changedFields: string[]): boolean {
  const criticalFields = [
    "event_type",
    "event_date",
    "quantity",
    "source_tlc_id",
    "destination_tlc_id",
    "output_tlc_id",
    "facility_id",
  ]

  return changedFields.some((field) => criticalFields.includes(field))
}
