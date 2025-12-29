/**
 * Unit Conversion Utility - FSMA 204 Compliance
 * Converts all units to base unit (kg) for accurate stock calculations
 */

export interface ConversionMap {
  [key: string]: number
}

const UNIT_CONVERSION_MAP: ConversionMap = {
  // Vietnamese units
  tấn: 1000,
  tạ: 100,
  yến: 10,
  kg: 1,
  kilogram: 1,
  g: 0.001,
  gram: 0.001,
  // English units
  ton: 1000,
  lb: 0.453592,
  lbs: 0.453592,
  pound: 0.453592,
  oz: 0.0283495,
  ounce: 0.0283495,
  // Generic
  units: 1,
  unit: 1,
  piece: 1,
  pieces: 1,
}

/**
 * Convert quantity to base unit (kg)
 * @param quantity - numeric quantity
 * @param unit - unit of measurement
 * @returns quantity in kg
 * @throws Error if unit not supported
 */
export function convertToBaseUnit(quantity: number | string, unit: string): number {
  if (!quantity || isNaN(Number(quantity))) {
    throw new Error("Số lượng phải là số hợp lệ")
  }

  const numQuantity = Number(quantity)
  const normalizedUnit = (unit || "").trim().toLowerCase()

  if (!normalizedUnit) {
    throw new Error("Vui lòng chọn đơn vị")
  }

  const factor = UNIT_CONVERSION_MAP[normalizedUnit]

  if (factor === undefined) {
    throw new Error(`Đơn vị "${unit}" không được hỗ trợ. Vui lòng chọn: tấn, tạ, yến, kg, g, lb, oz, hoặc units`)
  }

  return numQuantity * factor
}

/**
 * Get supported units list for dropdown/autocomplete
 */
export function getSupportedUnits(): string[] {
  return Object.keys(UNIT_CONVERSION_MAP)
}

/**
 * Get human-readable unit name and conversion info
 */
export function getUnitInfo(unit: string): { name: string; baseUnitEquivalent: string } {
  const normalizedUnit = unit.toLowerCase()
  const factor = UNIT_CONVERSION_MAP[normalizedUnit]

  if (!factor) {
    return { name: unit, baseUnitEquivalent: "Không xác định" }
  }

  const inKg = 1 * factor
  if (inKg < 1) {
    return { name: unit, baseUnitEquivalent: `${(1 / factor).toFixed(0)} ${unit} = 1 kg` }
  } else if (inKg === 1) {
    return { name: unit, baseUnitEquivalent: unit }
  } else {
    return { name: unit, baseUnitEquivalent: `1 ${unit} = ${inKg} kg` }
  }
}
