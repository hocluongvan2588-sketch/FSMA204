/**
 * FSMA 204 - Comprehensive Stock Calculation Function
 * Calculates current available stock based on ALL event types
 *
 * Formula: Current Stock = Inputs - Outputs
 * Inputs: production, receiving, harvest, returns
 * Outputs: shipping, transformation_input, disposal
 */

import { createClient } from "@/lib/supabase/client"
import { convertToBaseUnit } from "./unit-converter"

export interface StockCalculationResult {
  tlc_id: string
  tlc_code: string
  current_stock: number
  total_production: number
  total_receiving: number
  total_harvest: number
  total_returns: number
  total_shipping: number
  total_transformation_input: number
  total_disposal: number
  is_negative: boolean
  last_updated: Date
}

/**
 * Calculate current stock for a TLC based on ALL CTE event types
 * This is the main function that should be used everywhere
 */
export async function calculateCurrentStock(tlcCode: string): Promise<StockCalculationResult> {
  const supabase = createClient()

  // Get TLC info
  const { data: tlcData, error: tlcError } = await supabase
    .from("traceability_lots")
    .select("id, tlc, quantity")
    .eq("tlc", tlcCode.trim())
    .single()

  if (tlcError || !tlcData) {
    throw new Error(`TLC not found: ${tlcCode}`)
  }

  const tlcId = tlcData.id

  // ===== INPUTS (Addition) =====

  // 1. Production (Initial harvest/creation)
  const totalProduction = tlcData.quantity || 0

  // 2. Receiving events (when TLC is received from upstream) - Include all receiving variants
  const { data: receivingEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed, unit")
    .eq("tlc_id", tlcId)
    .in("event_type", ["receiving", "receiving_distributor", "first_receiving", "receiving_warehouse"]) // Query all receiving event types

  const totalReceiving = (receivingEvents || []).reduce((sum, e) => {
    try {
      const inKg = convertToBaseUnit(e.quantity_processed || 0, e.unit || "kg")
      return sum + inKg
    } catch {
      return sum
    }
  }, 0)

  // 3. Harvest events (direct harvest, not transformation output)
  const { data: harvestEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed, unit")
    .eq("tlc_id", tlcId)
    .eq("event_type", "harvest")

  const totalHarvest = (harvestEvents || []).reduce((sum, e) => {
    try {
      const inKg = convertToBaseUnit(e.quantity_processed || 0, e.unit || "kg")
      return sum + inKg
    } catch {
      return sum
    }
  }, 0)

  // 4. Returns (if product is returned for reuse)
  const { data: returnEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed, unit")
    .eq("tlc_id", tlcId)
    .eq("event_type", "return")

  const totalReturns = (returnEvents || []).reduce((sum, e) => {
    try {
      const inKg = convertToBaseUnit(e.quantity_processed || 0, e.unit || "kg")
      return sum + inKg
    } catch {
      return sum
    }
  }, 0)

  // ===== OUTPUTS (Subtraction) =====

  // 1. Shipping events (when TLC leaves company) - Include all shipping variants
  const { data: shippingEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed, unit")
    .eq("tlc_id", tlcId)
    .in("event_type", ["shipping", "shipping_distributor", "dispatch"]) // Query all shipping event types

  const totalShipping = (shippingEvents || []).reduce((sum, e) => {
    try {
      const inKg = convertToBaseUnit(e.quantity_processed || 0, e.unit || "kg")
      return sum + inKg
    } catch {
      return sum
    }
  }, 0)

  // 2. Transformation input (when TLC is used as input for transformation)
  const { data: transformationInputs } = await supabase
    .from("transformation_inputs")
    .select("quantity_used, unit")
    .eq("input_tlc_id", tlcId)

  const totalTransformationInput = (transformationInputs || []).reduce((sum, t) => {
    try {
      const inKg = convertToBaseUnit(t.quantity_used || 0, t.unit || "kg")
      return sum + inKg
    } catch (conversionError) {
      // ❌ LỖI CŨ: return sum (bỏ qua lỗi)
      // ✅ FIX: Log error và throw để không tính sai tồn kho
      console.error(`[v0] CRITICAL: Unit conversion failed for transformation input TLC ${tlcId}:`, {
        quantity_used: t.quantity_used,
        unit: t.unit,
        error: conversionError,
      })
      throw new Error(
        `Lỗi nghiêm trọng: Không thể convert đơn vị "${t.unit}" cho transformation input. ` +
          `TLC ${tlcId} có dữ liệu không hợp lệ. Vui lòng kiểm tra lại transformation inputs.`,
      )
    }
  }, 0)

  // 3. Disposal/Waste events (when TLC is discarded)
  const { data: disposalEvents } = await supabase
    .from("critical_tracking_events")
    .select("quantity_processed, unit")
    .eq("tlc_id", tlcId)
    .in("event_type", ["disposal", "waste", "destruction"]) // Query all disposal event types

  const totalDisposal = (disposalEvents || []).reduce((sum, e) => {
    try {
      const inKg = convertToBaseUnit(e.quantity_processed || 0, e.unit || "kg")
      return sum + inKg
    } catch {
      return sum
    }
  }, 0)

  // ===== CALCULATE CURRENT STOCK =====
  const totalInputs = totalProduction + totalReceiving + totalHarvest + totalReturns
  const totalOutputs = totalShipping + totalTransformationInput + totalDisposal
  const currentStock = totalInputs - totalOutputs

  const isNegative = currentStock < 0

  // Log if negative for debugging
  if (isNegative) {
    console.warn(`[v0] NEGATIVE STOCK DETECTED: TLC ${tlcCode} has stock of ${currentStock}`)
  }

  return {
    tlc_id: tlcId,
    tlc_code: tlcCode,
    current_stock: currentStock,
    total_production: totalProduction,
    total_receiving: totalReceiving,
    total_harvest: totalHarvest,
    total_returns: totalReturns,
    total_shipping: totalShipping,
    total_transformation_input: totalTransformationInput,
    total_disposal: totalDisposal,
    is_negative: isNegative,
    last_updated: new Date(),
  }
}

/**
 * Get available stock for a TLC - simplified version
 * Returns only the numeric value
 */
export async function getAvailableStock(tlcCode: string): Promise<number> {
  try {
    const result = await calculateCurrentStock(tlcCode)
    return result.current_stock
  } catch (error) {
    console.error(`[v0] Error calculating stock for ${tlcCode}:`, error)
    return 0
  }
}

/**
 * Validate if a shipping quantity is allowed
 */
export async function canShipQuantity(
  tlcCode: string,
  shippingQuantity: number,
): Promise<{
  canShip: boolean
  availableStock: number
  errorMessage?: string
}> {
  try {
    const stock = await calculateCurrentStock(tlcCode)

    if (shippingQuantity > stock.current_stock) {
      return {
        canShip: false,
        availableStock: stock.current_stock,
        errorMessage: `❌ Không thể vận chuyển ${shippingQuantity} kg. Chỉ còn ${stock.current_stock} kg khả dụng.`,
      }
    }

    return {
      canShip: true,
      availableStock: stock.current_stock,
    }
  } catch (error) {
    console.error(`[v0] Error validating shipment:`, error)
    return {
      canShip: false,
      availableStock: 0,
      errorMessage: "Lỗi hệ thống khi kiểm tra tồn kho",
    }
  }
}

/**
 * Get list of all TLCs with negative stock for compliance alerts
 */
export async function getNegativeStockTLCs(companyId: string): Promise<StockCalculationResult[]> {
  const supabase = createClient()

  // Get all active TLCs for the company
  const { data: tlcs } = await supabase
    .from("traceability_lots")
    .select("tlc")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const negativeStockTLCs: StockCalculationResult[] = []

  if (!tlcs) return negativeStockTLCs

  for (const tlc of tlcs) {
    try {
      const result = await calculateCurrentStock(tlc.tlc)
      if (result.is_negative) {
        negativeStockTLCs.push(result)
      }
    } catch (error) {
      console.error(`[v0] Error calculating stock for ${tlc.tlc}:`, error)
    }
  }

  return negativeStockTLCs
}
