/**
 * FSMA 204 Compliant Waste Tracking Utility
 * Tracks and analyzes waste in transformation processes
 */

import { createClient } from "@/lib/supabase/server"

export interface WasteRecord {
  inputTlcId: string
  quantityUsed: number
  unit: string
  wastePercentage: number
  actualWasteQuantity?: number
  wasteReason?: string
  wasteVariance?: number
}

export interface WasteAnalysis {
  totalInputQuantity: number
  expectedWaste: number
  actualWaste: number
  wasteVariance: number
  variancePercentage: number
  isSignificantVariance: boolean
  recommendations: string[]
}

export interface WasteSummary {
  transformationId: string
  facilityName: string
  outputTlc: string
  productName: string
  inputCount: number
  totalInputQuantity: number
  expectedWaste: number
  actualWaste: number
  totalVariance: number
  avgWastePercentage: number
  wasteReasons: string[]
}

/**
 * Calculate waste variance
 */
export function calculateWasteVariance(
  quantityUsed: number,
  wastePercentage: number,
  actualWasteQuantity: number,
): number {
  const expectedWaste = (quantityUsed * wastePercentage) / 100
  return actualWasteQuantity - expectedWaste
}

/**
 * Analyze waste for a transformation
 */
export function analyzeWaste(wasteRecords: WasteRecord[]): WasteAnalysis {
  const totalInputQuantity = wasteRecords.reduce((sum, record) => sum + record.quantityUsed, 0)

  const expectedWaste = wasteRecords.reduce((sum, record) => {
    return sum + (record.quantityUsed * record.wastePercentage) / 100
  }, 0)

  const actualWaste = wasteRecords.reduce((sum, record) => {
    return sum + (record.actualWasteQuantity || 0)
  }, 0)

  const wasteVariance = actualWaste - expectedWaste
  const variancePercentage = expectedWaste > 0 ? (wasteVariance / expectedWaste) * 100 : 0

  // Significant variance if > 20% difference from expected
  const isSignificantVariance = Math.abs(variancePercentage) > 20

  const recommendations: string[] = []

  if (isSignificantVariance && wasteVariance > 0) {
    recommendations.push("⚠️ Waste cao hơn dự kiến. Cần điều tra nguyên nhân.")
    recommendations.push("🔍 Review quy trình sản xuất để giảm waste.")
    recommendations.push("📊 Cập nhật waste_percentage chuẩn cho lần sau.")
  } else if (isSignificantVariance && wasteVariance < 0) {
    recommendations.push("✅ Waste thấp hơn dự kiến - Quy trình tốt!")
    recommendations.push("📊 Cân nhắc giảm waste_percentage chuẩn.")
  } else {
    recommendations.push("✅ Waste trong giới hạn chấp nhận được.")
  }

  if (actualWaste === 0) {
    recommendations.push("⚠️ Chưa ghi nhận actual waste. Vui lòng cập nhật.")
  }

  return {
    totalInputQuantity,
    expectedWaste,
    actualWaste,
    wasteVariance,
    variancePercentage,
    isSignificantVariance,
    recommendations,
  }
}

/**
 * Get waste summary from database
 */
export async function getWasteSummary(transformationId: string): Promise<WasteSummary | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("waste_tracking_summary")
    .select("*")
    .eq("transformation_id", transformationId)
    .single()

  if (error || !data) {
    console.error("[v0] Failed to fetch waste summary:", error)
    return null
  }

  return {
    transformationId: data.transformation_id,
    facilityName: data.facility_name,
    outputTlc: data.output_tlc,
    productName: data.product_name,
    inputCount: data.input_count,
    totalInputQuantity: Number.parseFloat(data.total_input_quantity),
    expectedWaste: Number.parseFloat(data.expected_waste || "0"),
    actualWaste: Number.parseFloat(data.actual_waste || "0"),
    totalVariance: Number.parseFloat(data.total_variance || "0"),
    avgWastePercentage: Number.parseFloat(data.avg_waste_percentage || "0"),
    wasteReasons: data.waste_reasons || [],
  }
}

/**
 * Validate waste percentage
 */
export function validateWastePercentage(wastePercentage: number): { valid: boolean; message?: string } {
  if (wastePercentage < 0) {
    return { valid: false, message: "Waste percentage không được âm" }
  }

  if (wastePercentage > 100) {
    return { valid: false, message: "Waste percentage không được vượt quá 100%" }
  }

  if (wastePercentage > 50) {
    return {
      valid: true,
      message: "⚠️ Waste percentage cao bất thường (>50%). Vui lòng kiểm tra lại.",
    }
  }

  return { valid: true }
}

/**
 * Get waste reasons list
 */
export const WASTE_REASONS = [
  "Trimming/Cleaning",
  "Damaged Product",
  "Spoilage",
  "Quality Control Rejection",
  "Processing Loss",
  "Handling Loss",
  "Equipment Malfunction",
  "Other",
] as const

export type WasteReason = (typeof WASTE_REASONS)[number]
