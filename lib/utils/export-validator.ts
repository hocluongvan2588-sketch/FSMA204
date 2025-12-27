/**
 * Export validation utility for FSMA 204 compliance
 * Ensures all exported data meets regulatory requirements
 */

export interface ExportValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  rowCount: number
  columnCheck: {
    cteType: boolean
    tlc: boolean
    dateTime: boolean
    locationId: boolean
    productDescription: boolean
    quantity: boolean
  }
}

/**
 * Validate exported FSMA 204 data
 */
export function validateFSMA204Export(csvContent: string): ExportValidationResult {
  const lines = csvContent.split("\n").filter((line) => line.trim())
  const result: ExportValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    rowCount: 0,
    columnCheck: {
      cteType: false,
      tlc: false,
      dateTime: false,
      locationId: false,
      productDescription: false,
      quantity: false,
    },
  }

  if (lines.length < 2) {
    result.isValid = false
    result.errors.push("CSV must contain header and at least one data row")
    return result
  }

  const header = lines[0]
  const requiredColumns = ["CTE Type", "TLC", "Date/Time", "Location ID", "Product Description", "Quantity"]

  // Check for required columns
  requiredColumns.forEach((col) => {
    const found = header.includes(col)
    if (found) {
      const key = col.toLowerCase().replace(/\//g, "").replace(/\s+/g, "") as keyof typeof result.columnCheck
      if (key in result.columnCheck) {
        result.columnCheck[key] = true
      }
    } else {
      result.isValid = false
      result.errors.push(`Missing required column: ${col}`)
    }
  })

  // Validate data rows
  result.rowCount = lines.length - 1

  if (result.rowCount === 0) {
    result.warnings.push("No data rows found in export")
  } else if (result.rowCount > 10000) {
    result.warnings.push(`Large export detected (${result.rowCount} rows). Ensure streaming was used.`)
  }

  // Check for UTF-8 BOM (Excel compatibility)
  if (!csvContent.startsWith("\uFEFF")) {
    result.warnings.push("UTF-8 BOM not detected. Export may not display correctly in Excel on some systems.")
  }

  // Validate sample rows
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    const row = lines[i]
    const columns = row.split(",")

    if (columns.length < 6) {
      result.errors.push(`Row ${i} has insufficient columns`)
      result.isValid = false
    }

    // CTE Type validation
    const validCTETypes = ["Thu hoạch", "Làm mát", "Đóng gói", "Nhận hàng", "Vận chuyển", "Chế biến"]
    if (!validCTETypes.includes(columns[0]?.trim())) {
      result.warnings.push(`Row ${i}: Invalid CTE Type: ${columns[0]}`)
    }
  }

  if (result.errors.length === 0) {
    result.isValid = true
  }

  return result
}

/**
 * Check if export data is complete and sortable
 */
export function validateSortableFormat(csvContent: string): {
  isSortable: boolean
  sortableColumns: string[]
  issues: string[]
} {
  const lines = csvContent.split("\n")
  const header = lines[0]
  const issues: string[] = []

  // Excel requires proper CSV format with headers for sorting
  const isSortable = header.includes("CTE Type") && header.includes("Date/Time") && header.includes("TLC")

  const sortableColumns = header
    .split(",")
    .map((col) => col.trim())
    .filter((col) => col.length > 0)

  if (!isSortable) {
    issues.push("CSV format not compatible with Excel sorting")
  }

  return {
    isSortable,
    sortableColumns,
    issues,
  }
}

/**
 * Generate validation report for FDA inspection readiness
 */
export function generateValidationReport(csvContent: string): {
  status: "compliant" | "warning" | "non-compliant"
  summary: string
  details: string[]
  recommendedActions: string[]
} {
  const validation = validateFSMA204Export(csvContent)
  const sortableCheck = validateSortableFormat(csvContent)

  let status: "compliant" | "warning" | "non-compliant" = validation.isValid ? "compliant" : "non-compliant"

  if (validation.warnings.length > 0 && status === "compliant") {
    status = "warning"
  }

  const details: string[] = [
    `Total Records: ${validation.rowCount}`,
    `Required Columns Present: ${Object.values(validation.columnCheck).filter((v) => v).length}/6`,
    `Sortable Format: ${sortableCheck.isSortable ? "Yes" : "No"}`,
    ...validation.errors,
    ...validation.warnings,
  ]

  const recommendedActions: string[] = []

  if (validation.rowCount > 10000) {
    recommendedActions.push("Streaming export was used - optimal for large datasets")
  }

  if (!sortableCheck.isSortable) {
    recommendedActions.push("Re-export with proper CSV formatting")
  }

  if (validation.errors.length > 0) {
    recommendedActions.push("Fix validation errors before FDA submission")
  }

  return {
    status,
    summary:
      status === "compliant"
        ? "Export meets FSMA 204 compliance requirements"
        : status === "warning"
          ? "Export is mostly compliant but has warnings"
          : "Export does not meet compliance requirements",
    details,
    recommendedActions,
  }
}
