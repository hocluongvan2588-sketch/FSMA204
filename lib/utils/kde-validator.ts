export interface KDEValidationError {
  kde_code: string
  kde_name: string
  error_message: string
  severity: "error" | "warning"
}

export interface KDEValidationResult {
  valid: boolean
  errors: KDEValidationError[]
  warnings: KDEValidationError[]
  missing_required_kdes: string[]
}

/**
 * FSMA 204 Required KDEs by Event Type
 * Source: FDA FSMA 204 Final Rule Section 204.4
 */
const REQUIRED_KDES_BY_EVENT: Record<string, string[]> = {
  harvest: ["harvest_date", "harvest_location", "quantity"],
  cooling: ["cooling_date", "cooling_temp", "cooling_method"],
  initial_packing: ["packing_date", "packing_location", "lot_code"],
  packing: ["packing_date", "packing_location", "lot_code"],
  receiving: ["receiving_date", "supplier_name", "quantity"],
  receiving_distributor: ["receiving_date", "supplier_name", "quantity"],
  transformation: ["transformation_date", "input_lots", "output_quantity", "process_type"],
  shipping: ["shipping_date", "destination", "carrier", "quantity"],
  shipping_distributor: ["shipping_date", "destination", "carrier", "quantity"],
}

/**
 * KDE Data Type Validation Rules
 */
const KDE_DATA_TYPES: Record<string, "string" | "number" | "date" | "array"> = {
  harvest_date: "date",
  cooling_date: "date",
  packing_date: "date",
  receiving_date: "date",
  transformation_date: "date",
  shipping_date: "date",
  cooling_temp: "number",
  quantity: "number",
  output_quantity: "number",
  input_lots: "array",
}

/**
 * KDE Range Validation Rules (for numbers)
 */
const KDE_RANGES: Record<string, { min?: number; max?: number; unit?: string }> = {
  cooling_temp: { min: 0, max: 4, unit: "°C" }, // Cold chain requirements
  quantity: { min: 0 },
  output_quantity: { min: 0 },
}

/**
 * Validate KDEs for a specific event type
 * @param eventType - CTE event type (harvest, cooling, etc.)
 * @param kdeValues - Object with kde_code as keys and values as values
 * @returns Validation result with errors and warnings
 */
export async function validateKDEs(eventType: string, kdeValues: Record<string, string>): Promise<KDEValidationResult> {
  const errors: KDEValidationError[] = []
  const warnings: KDEValidationError[] = []
  const missing_required_kdes: string[] = []

  // Get required KDEs for this event type
  const requiredKDEs = REQUIRED_KDES_BY_EVENT[eventType] || []

  // Check if all required KDEs are present
  for (const kdeCode of requiredKDEs) {
    const value = kdeValues[kdeCode]

    if (!value || value.trim() === "") {
      missing_required_kdes.push(kdeCode)
      errors.push({
        kde_code: kdeCode,
        kde_name: formatKDEName(kdeCode),
        error_message: `Thiếu KDE bắt buộc: ${formatKDEName(kdeCode)} (${kdeCode})`,
        severity: "error",
      })
    }
  }

  // Validate data types and ranges
  for (const [kdeCode, value] of Object.entries(kdeValues)) {
    if (!value || value.trim() === "") continue

    // Data type validation
    const expectedType = KDE_DATA_TYPES[kdeCode]
    if (expectedType) {
      const typeValidation = validateDataType(kdeCode, value, expectedType)
      if (!typeValidation.valid) {
        errors.push({
          kde_code: kdeCode,
          kde_name: formatKDEName(kdeCode),
          error_message: typeValidation.error!,
          severity: "error",
        })
      }
    }

    // Range validation for numbers
    const rangeRule = KDE_RANGES[kdeCode]
    if (rangeRule && expectedType === "number") {
      const numValue = Number.parseFloat(value)
      if (!Number.isNaN(numValue)) {
        if (rangeRule.min !== undefined && numValue < rangeRule.min) {
          errors.push({
            kde_code: kdeCode,
            kde_name: formatKDEName(kdeCode),
            error_message: `${formatKDEName(kdeCode)} phải >= ${rangeRule.min}${rangeRule.unit || ""}`,
            severity: "error",
          })
        }
        if (rangeRule.max !== undefined && numValue > rangeRule.max) {
          errors.push({
            kde_code: kdeCode,
            kde_name: formatKDEName(kdeCode),
            error_message: `${formatKDEName(kdeCode)} phải <= ${rangeRule.max}${rangeRule.unit || ""}`,
            severity: "error",
          })
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missing_required_kdes,
  }
}

/**
 * Validate data type of a KDE value
 */
function validateDataType(
  kdeCode: string,
  value: string,
  expectedType: "string" | "number" | "date" | "array",
): { valid: boolean; error?: string } {
  switch (expectedType) {
    case "number": {
      const num = Number.parseFloat(value)
      if (Number.isNaN(num)) {
        return {
          valid: false,
          error: `${formatKDEName(kdeCode)} phải là số`,
        }
      }
      return { valid: true }
    }

    case "date": {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return {
          valid: false,
          error: `${formatKDEName(kdeCode)} phải là ngày hợp lệ (YYYY-MM-DD)`,
        }
      }
      return { valid: true }
    }

    case "array": {
      try {
        const arr = JSON.parse(value)
        if (!Array.isArray(arr)) {
          return {
            valid: false,
            error: `${formatKDEName(kdeCode)} phải là danh sách (array)`,
          }
        }
        return { valid: true }
      } catch {
        return {
          valid: false,
          error: `${formatKDEName(kdeCode)} không đúng định dạng JSON array`,
        }
      }
    }

    case "string":
    default:
      return { valid: true }
  }
}

/**
 * Format KDE code to human-readable name
 */
function formatKDEName(kdeCode: string): string {
  const names: Record<string, string> = {
    harvest_date: "Ngày thu hoạch",
    harvest_location: "Địa điểm thu hoạch",
    cooling_date: "Ngày làm lạnh",
    cooling_temp: "Nhiệt độ làm lạnh",
    cooling_method: "Phương pháp làm lạnh",
    packing_date: "Ngày đóng gói",
    packing_location: "Địa điểm đóng gói",
    lot_code: "Mã lô",
    receiving_date: "Ngày tiếp nhận",
    supplier_name: "Tên nhà cung cấp",
    transformation_date: "Ngày chế biến",
    input_lots: "Mã lô nguồn",
    output_quantity: "Số lượng đầu ra",
    process_type: "Loại quy trình",
    shipping_date: "Ngày vận chuyển",
    destination: "Địa điểm đến",
    carrier: "Đơn vị vận chuyển",
    quantity: "Số lượng",
  }

  return names[kdeCode] || kdeCode
}

/**
 * Get required KDEs for an event type
 */
export function getRequiredKDEs(eventType: string): string[] {
  return REQUIRED_KDES_BY_EVENT[eventType] || []
}

/**
 * Synchronous KDE validation for real-time UI feedback
 * Returns validation results with detailed field-level information
 */
export function validateKDE(eventType: string, kdeValues: Record<string, string>) {
  const results: Array<{
    field: string
    message: string
    severity: "error" | "warning" | "info"
    reference?: string
  }> = []

  // Get required KDEs for this event type
  const requiredKDEs = REQUIRED_KDES_BY_EVENT[eventType] || []

  // Check each required KDE
  for (const kdeCode of requiredKDEs) {
    const value = kdeValues[kdeCode]
    const fieldName = formatKDEName(kdeCode)

    if (!value || value.trim() === "") {
      results.push({
        field: fieldName,
        message: `Trường bắt buộc chưa được điền. FDA FSMA Section 204.4 yêu cầu KDE này cho sự kiện ${eventType}.`,
        severity: "error",
        reference: `FDA FSMA 204.4 - ${kdeCode}`,
      })
      continue
    }

    // Validate data type
    const expectedType = KDE_DATA_TYPES[kdeCode]
    if (expectedType) {
      const typeValidation = validateDataType(kdeCode, value, expectedType)
      if (!typeValidation.valid) {
        results.push({
          field: fieldName,
          message: typeValidation.error!,
          severity: "error",
          reference: `Data type: ${expectedType}`,
        })
        continue
      }
    }

    // Validate range for numbers
    const rangeRule = KDE_RANGES[kdeCode]
    if (rangeRule && expectedType === "number") {
      const numValue = Number.parseFloat(value)
      if (!Number.isNaN(numValue)) {
        if (rangeRule.min !== undefined && numValue < rangeRule.min) {
          results.push({
            field: fieldName,
            message: `Giá trị phải >= ${rangeRule.min}${rangeRule.unit || ""}. FDA Food Code yêu cầu tuân thủ giới hạn này.`,
            severity: "error",
            reference: `Valid range: ${rangeRule.min}-${rangeRule.max}${rangeRule.unit || ""}`,
          })
          continue
        }
        if (rangeRule.max !== undefined && numValue > rangeRule.max) {
          results.push({
            field: fieldName,
            message: `Giá trị phải <= ${rangeRule.max}${rangeRule.unit || ""}. FDA Food Code yêu cầu tuân thủ giới hạn này.`,
            severity: "error",
            reference: `Valid range: ${rangeRule.min}-${rangeRule.max}${rangeRule.unit || ""}`,
          })
          continue
        }
      }
    }

    // If validation passed, add success info
    results.push({
      field: fieldName,
      message: "Dữ liệu hợp lệ",
      severity: "info",
      reference: `FDA FSMA 204.4 - ${kdeCode}`,
    })
  }

  // Check for optional KDEs that are filled (warnings if incomplete)
  const allKDEs = Object.keys(KDE_DATA_TYPES)
  for (const kdeCode of allKDEs) {
    if (requiredKDEs.includes(kdeCode)) continue // Skip required ones (already checked)

    const value = kdeValues[kdeCode]
    if (value && value.trim() !== "") {
      const fieldName = formatKDEName(kdeCode)

      // Validate data type for optional fields
      const expectedType = KDE_DATA_TYPES[kdeCode]
      if (expectedType) {
        const typeValidation = validateDataType(kdeCode, value, expectedType)
        if (!typeValidation.valid) {
          results.push({
            field: fieldName,
            message: `Trường tùy chọn có lỗi: ${typeValidation.error}`,
            severity: "warning",
          })
        } else {
          results.push({
            field: fieldName,
            message: "Trường tùy chọn hợp lệ - tăng tính minh bạch",
            severity: "info",
          })
        }
      }
    }
  }

  return {
    isValid: results.filter((r) => r.severity === "error").length === 0,
    results,
  }
}
