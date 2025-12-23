import { createClient } from "@/lib/supabase/client"

export interface KDEValidation {
  cte_id: string
  event_type: string
  missing_kdes: string[]
  required_kdes: string[]
  completion_percentage: number
}

export interface ComplianceStatus {
  overall_score: number
  total_ctes: number
  compliant_ctes: number
  non_compliant_ctes: number
  missing_kdes_summary: Record<string, number>
  recent_violations: KDEValidation[]
}

const REQUIRED_KDES_BY_EVENT: Record<string, string[]> = {
  harvest: ["harvest_date", "harvest_location", "farm_identification", "commodity"],
  cooling: ["cooling_date", "cooling_location", "temperature", "tlc"],
  packing: ["packing_date", "packing_location", "tlc", "quantity"],
  receiving: ["receiving_date", "receiving_location", "reference_tlc", "supplier_info"],
  shipping: ["shipping_date", "shipping_location", "tlc", "destination", "transport_info"],
  transformation: ["transformation_date", "transformation_location", "input_tlc", "output_tlc"],
}

export async function checkComplianceStatus(companyId: string): Promise<ComplianceStatus> {
  const supabase = createClient()

  // Get all CTEs with their KDEs
  const { data: ctes } = await supabase
    .from("critical_tracking_events")
    .select("id, event_type, key_data_elements(key_name, key_value)")
    .order("created_at", { ascending: false })

  if (!ctes || ctes.length === 0) {
    return {
      overall_score: 100,
      total_ctes: 0,
      compliant_ctes: 0,
      non_compliant_ctes: 0,
      missing_kdes_summary: {},
      recent_violations: [],
    }
  }

  const validations: KDEValidation[] = []
  const missing_kdes_count: Record<string, number> = {}

  for (const cte of ctes) {
    const required_kdes = REQUIRED_KDES_BY_EVENT[cte.event_type] || []
    const existing_kdes = (cte.key_data_elements || []).map((kde: any) => kde.key_name)
    const missing_kdes = required_kdes.filter((kde) => !existing_kdes.includes(kde))

    if (missing_kdes.length > 0) {
      validations.push({
        cte_id: cte.id,
        event_type: cte.event_type,
        missing_kdes,
        required_kdes,
        completion_percentage: Math.round(((required_kdes.length - missing_kdes.length) / required_kdes.length) * 100),
      })

      missing_kdes.forEach((kde) => {
        missing_kdes_count[kde] = (missing_kdes_count[kde] || 0) + 1
      })
    }
  }

  const compliant_ctes = ctes.length - validations.length
  const overall_score = Math.round((compliant_ctes / ctes.length) * 100)

  return {
    overall_score,
    total_ctes: ctes.length,
    compliant_ctes,
    non_compliant_ctes: validations.length,
    missing_kdes_summary: missing_kdes_count,
    recent_violations: validations.slice(0, 10),
  }
}
