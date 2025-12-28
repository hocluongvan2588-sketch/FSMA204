import { createClient } from "@/lib/supabase/client"

/**
 * FSMA 204 Transformation Validation
 * Ensures transformation events comply with FDA traceability requirements
 */

export interface TLCValidationResult {
  valid: boolean
  error?: string
  tlc?: {
    id: string
    tlc: string
    product_name: string
    status: string
    quantity: number
  }
}

/**
 * Validate if a TLC (Traceability Lot Code) exists and is eligible for use in transformation
 * @param tlcCode - The TLC code entered by user
 * @param companyId - Current company ID for security
 * @returns Validation result with TLC details if valid
 */
export async function validateSourceTLC(tlcCode: string, companyId?: string): Promise<TLCValidationResult> {
  const supabase = createClient()

  if (!tlcCode || tlcCode.trim() === "") {
    return {
      valid: false,
      error: "Mã lô không được để trống",
    }
  }

  try {
    // Query to find TLC with product info
    const query = supabase
      .from("traceability_lots")
      .select(
        `
        id,
        tlc,
        status,
        quantity,
        available_quantity,
        products (
          product_name
        )
      `,
      )
      .eq("tlc", tlcCode.trim())
      .single()

    const { data, error } = await query

    if (error || !data) {
      console.error("[v0] TLC validation error:", error)
      return {
        valid: false,
        error: "Mã lô nguồn không hợp lệ - Mã lô không tồn tại trong hệ thống",
      }
    }

    // Check if TLC is in valid status for transformation
    if (data.status !== "active") {
      return {
        valid: false,
        error: `Mã lô nguồn không hợp lệ - Trạng thái lô là "${data.status}" (cần "active")`,
      }
    }

    // Check if TLC has available quantity
    if (data.available_quantity <= 0) {
      return {
        valid: false,
        error: "Mã lô nguồn không hợp lệ - Lô đã hết hàng (số lượng khả dụng: 0)",
      }
    }

    // FSMA 204: Farms can transform their own harvest without receiving event
    const { data: harvestEvent } = await supabase
      .from("critical_tracking_events")
      .select("id, event_date, event_type")
      .eq("tlc_id", data.id)
      .eq("event_type", "harvest")
      .maybeSingle()

    const { data: receivingEvent } = await supabase
      .from("critical_tracking_events")
      .select("id, event_date, event_type")
      .eq("tlc_id", data.id)
      .eq("event_type", "receiving")
      .maybeSingle()

    // TLC must have at least ONE of: Harvest OR Receiving
    if (!harvestEvent && !receivingEvent) {
      return {
        valid: false,
        error:
          "FSMA 204 VIOLATION: Mã lô nguồn không hợp lệ - Lô phải có sự kiện Harvest (nếu tự sản xuất) hoặc Receiving (nếu nhập từ bên ngoài) trước khi chế biến.",
      }
    }

    // All validations passed
    return {
      valid: true,
      tlc: {
        id: data.id,
        tlc: data.tlc,
        product_name: data.products?.product_name || "Unknown",
        status: data.status,
        quantity: data.available_quantity,
      },
    }
  } catch (err) {
    console.error("[v0] TLC validation exception:", err)
    return {
      valid: false,
      error: "Lỗi hệ thống khi kiểm tra mã lô",
    }
  }
}

/**
 * Validate multiple source TLCs for transformation
 * @param tlcCodes - Array of TLC codes
 * @returns Array of validation results
 */
export async function validateMultipleSourceTLCs(tlcCodes: string[]): Promise<TLCValidationResult[]> {
  const results = await Promise.all(tlcCodes.map((code) => validateSourceTLC(code)))
  return results
}

/**
 * Check if transformation can be created (all inputs valid)
 * @param inputTLCs - Array of input TLC codes
 * @returns Overall validation result
 */
export async function canCreateTransformation(inputTLCs: string[]): Promise<{
  canCreate: boolean
  errors: string[]
  validTLCs: any[]
}> {
  if (inputTLCs.length === 0) {
    return {
      canCreate: false,
      errors: ["Transformation yêu cầu ít nhất 1 mã lô nguồn đầu vào"],
      validTLCs: [],
    }
  }

  const results = await validateMultipleSourceTLCs(inputTLCs)

  const errors = results.filter((r) => !r.valid).map((r) => r.error!)

  const validTLCs = results.filter((r) => r.valid).map((r) => r.tlc!)

  return {
    canCreate: errors.length === 0,
    errors,
    validTLCs,
  }
}
