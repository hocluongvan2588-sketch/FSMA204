/**
 * FSMA 204 Inventory Balance Validator
 *
 * Validates TLC (Traceability Lot Code) quantity logic:
 * Inventory_TLC = ∑(Input) - ∑(Output) - ∑(Loss/Processing)
 *
 * Automatically flags abnormal data and deducts compliance points
 */

import { createClient } from "@/lib/supabase/client"

export interface InventoryBalance {
  tlc_id: string
  tlc_code: string
  total_input: number
  total_output: number
  total_loss_processing: number
  expected_inventory: number
  actual_inventory: number
  variance: number
  variance_percentage: number
  is_valid: boolean
  severity: "critical" | "high" | "medium" | "low" | "ok"
  flag_type: "normal" | "abnormal" | "critical_violation"
  compliance_deduction: number
  recommendation: string
}

export interface ValidationResult {
  tlc_id: string
  tlc_code: string
  validation_passed: boolean
  inventory_balance: InventoryBalance
  flagged_at: Date
  alert_created: boolean
}

/**
 * Calculate inventory balance for a TLC
 * Formula: Expected_Inventory = ∑(Input) - ∑(Output) - ∑(Loss/Processing)
 */
export async function validateTLCInventoryBalance(tlcId: string): Promise<InventoryBalance> {
  const supabase = createClient()

  // Fetch TLC information
  const { data: tlcData, error: tlcError } = await supabase
    .from("traceability_lots")
    .select("id, tlc, quantity, available_quantity, shipped_quantity")
    .eq("id", tlcId)
    .single()

  if (tlcError || !tlcData) {
    throw new Error(`TLC not found: ${tlcId}`)
  }

  // Get all CTEs related to this TLC to calculate inputs
  const { data: receivingEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed, unit")
    .eq("tlc_id", tlcId)
    .eq("event_type", "receiving")

  // Get transformation inputs (source materials)
  const { data: transformationInputs } = await supabase
    .from("transformation_inputs")
    .select("quantity_used, waste_percentage")
    .eq("input_tlc_id", tlcId)

  // Get shipping outputs
  const { data: shippingEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed")
    .eq("tlc_id", tlcId)
    .eq("event_type", "shipping")

  // Get transformation events (loss/processing)
  const { data: transformationEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed")
    .eq("tlc_id", tlcId)
    .eq("event_type", "transformation")

  // Calculate totals
  const totalInput =
    (receivingEvents || []).reduce((sum, e) => sum + (e.quantity_processed || 0), 0) || tlcData.quantity

  const totalOutput = (shippingEvents || []).reduce((sum, e) => sum + (e.quantity_processed || 0), 0)

  const totalLossProcessing = (transformationInputs || []).reduce((sum, input) => {
    const wastePercent = input.waste_percentage || 5
    const waste = input.quantity_used * (wastePercent / 100)
    return sum + waste
  }, 0)

  // Calculate expected inventory
  const expectedInventory = totalInput - totalOutput - totalLossProcessing

  // Actual inventory from database
  const actualInventory = tlcData.available_quantity || 0

  // Calculate variance
  const variance = Math.abs(actualInventory - expectedInventory)
  const variancePercentage = expectedInventory > 0 ? (variance / expectedInventory) * 100 : 0

  // Determine severity and flag type
  let severity: "critical" | "high" | "medium" | "low" | "ok"
  let flagType: "normal" | "abnormal" | "critical_violation"
  let complianceDeduction = 0
  let recommendation = ""

  if (actualInventory > expectedInventory) {
    // Inventory is HIGHER than expected - potential data entry error or unrecorded input
    const excessAmount = actualInventory - expectedInventory

    if (variancePercentage > 20) {
      severity = "critical"
      flagType = "critical_violation"
      complianceDeduction = 15
      recommendation = `⚠️ CRITICAL: Tồn kho thực tế (${actualInventory.toFixed(2)}) cao hơn dự kiến (${expectedInventory.toFixed(2)}) ${variancePercentage.toFixed(1)}%. Có thể có lô hàng đầu vào chưa được ghi nhận hoặc sai số liệu.`
    } else if (variancePercentage > 10) {
      severity = "high"
      flagType = "abnormal"
      complianceDeduction = 10
      recommendation = `⚠️ Tồn kho cao hơn dự kiến ${variancePercentage.toFixed(1)}%. Hãy kiểm tra xem có đầu vào chưa ghi nhận.`
    } else if (variancePercentage > 5) {
      severity = "medium"
      flagType = "abnormal"
      complianceDeduction = 5
      recommendation = `ℹ️ Tồn kho cao hơn dự kiến ${variancePercentage.toFixed(1)}%. Đáng chú ý.`
    } else {
      severity = "ok"
      flagType = "normal"
      complianceDeduction = 0
      recommendation = "✅ Tồn kho hợp lý trong phạm vi dung sai (±5%)"
    }
  } else if (actualInventory < expectedInventory) {
    // Inventory is LOWER than expected - potential data loss or over-shipping
    const shortfallAmount = expectedInventory - actualInventory

    if (variancePercentage > 20) {
      severity = "critical"
      flagType = "critical_violation"
      complianceDeduction = 20
      recommendation = `🔴 CRITICAL VIOLATION: Tồn kho thực tế (${actualInventory.toFixed(2)}) thấp hơn dự kiến (${expectedInventory.toFixed(2)}) ${variancePercentage.toFixed(1)}%. ĐÃ XUẤT HÀNG VƯỢT QUÁ TỒN KHO HOẶC THIẾU DỮ LIỆU NHẬP. Tuân thủ bị trừ 20 điểm.`
      flagType = "critical_violation"
    } else if (variancePercentage > 10) {
      severity = "high"
      flagType = "abnormal"
      complianceDeduction = 12
      recommendation = `🟠 Tồn kho thấp hơn dự kiến ${variancePercentage.toFixed(1)}%. Có thể đã xuất hàng vượt tồn kho hoặc hao hụt chưa ghi nhận.`
    } else if (variancePercentage > 5) {
      severity = "medium"
      flagType = "abnormal"
      complianceDeduction = 7
      recommendation = `🟡 Tồn kho thấp hơn dự kiến ${variancePercentage.toFixed(1)}%. Kiểm tra hao hụt/chế biến.`
    } else {
      severity = "ok"
      flagType = "normal"
      complianceDeduction = 0
      recommendation = "✅ Tồn kho hợp lý trong phạm vi dung sai (±5%)"
    }
  } else {
    // Perfect match
    severity = "ok"
    flagType = "normal"
    complianceDeduction = 0
    recommendation = "✅ Tồn kho khớp hoàn hảo với tính toán"
  }

  return {
    tlc_id: tlcId,
    tlc_code: tlcData.tlc,
    total_input: totalInput,
    total_output: totalOutput,
    total_loss_processing: totalLossProcessing,
    expected_inventory: expectedInventory,
    actual_inventory: actualInventory,
    variance,
    variance_percentage: variancePercentage,
    is_valid: flagType === "normal" && variancePercentage <= 5,
    severity,
    flag_type: flagType,
    compliance_deduction: complianceDeduction,
    recommendation,
  }
}

/**
 * Validate all TLCs in a company and flag abnormal ones
 */
export async function validateAllTLCInventoryBalances(companyId: string): Promise<ValidationResult[]> {
  const supabase = createClient()

  // Get all active TLCs for the company
  const { data: tlcs } = await supabase
    .from("traceability_lots")
    .select("id, tlc")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const results: ValidationResult[] = []

  if (!tlcs) return results

  for (const tlc of tlcs) {
    try {
      const balance = await validateTLCInventoryBalance(tlc.id)

      if (balance.flag_type !== "normal") {
        // Create alert for abnormal data
        const { error: alertError } = await supabase.from("data_quality_alerts").insert({
          company_id: companyId,
          alert_type: "quantity_mismatch",
          severity: balance.severity,
          status: "open",
          tlc_id: tlc.id,
          description: balance.recommendation,
          metadata: {
            expected_inventory: balance.expected_inventory,
            actual_inventory: balance.actual_inventory,
            variance: balance.variance,
            variance_percentage: balance.variance_percentage,
            compliance_deduction: balance.compliance_deduction,
          },
        })

        results.push({
          tlc_id: tlc.id,
          tlc_code: tlc.tlc,
          validation_passed: balance.is_valid,
          inventory_balance: balance,
          flagged_at: new Date(),
          alert_created: !alertError,
        })
      }
    } catch (error) {
      console.error(`[v0] Error validating TLC ${tlc.tlc}:`, error)
    }
  }

  return results
}

/**
 * Validate shipping operation before allowing export
 * Prevents shipping more than available inventory
 */
export async function validateShippingInventory(
  tlcId: string,
  shippingQuantity: number,
): Promise<{
  can_ship: boolean
  available_quantity: number
  requested_quantity: number
  shortage: number
  error_message?: string
}> {
  const supabase = createClient()

  const { data: tlc } = await supabase
    .from("traceability_lots")
    .select("available_quantity, tlc")
    .eq("id", tlcId)
    .single()

  if (!tlc) {
    return {
      can_ship: false,
      available_quantity: 0,
      requested_quantity: shippingQuantity,
      shortage: shippingQuantity,
      error_message: "TLC không tồn tại",
    }
  }

  const available = tlc.available_quantity || 0
  const shortage = Math.max(0, shippingQuantity - available)

  if (shippingQuantity > available) {
    return {
      can_ship: false,
      available_quantity: available,
      requested_quantity: shippingQuantity,
      shortage: shortage,
      error_message: `❌ INVENTORY SHORTAGE: TLC ${tlc.tlc} chỉ có ${available} nhưng yêu cầu xuất ${shippingQuantity}. Thiếu ${shortage}.`,
    }
  }

  return {
    can_ship: true,
    available_quantity: available,
    requested_quantity: shippingQuantity,
    shortage: 0,
  }
}
