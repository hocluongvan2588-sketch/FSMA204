import { createClient } from "@/lib/supabase/client"

/**
 * Soft delete a CTE record with reason
 */
export async function softDeleteCTE(cteId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc("soft_delete_cte", {
      p_cte_id: cteId,
      p_reason: reason,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Restore a soft-deleted CTE record
 */
export async function restoreCTE(cteId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc("restore_cte", {
      p_cte_id: cteId,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get audit history for a specific record
 */
export async function getRecordAuditHistory(
  tableName: string,
  recordId: string,
  limit = 50,
): Promise<{ data: any[] | null; error: string | null }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("get_record_audit_history", {
      p_table_name: tableName,
      p_record_id: recordId,
      p_limit: limit,
    })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
