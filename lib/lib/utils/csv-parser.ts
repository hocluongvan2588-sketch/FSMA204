// Utility functions for CSV parsing and validation
export interface CSVRow {
  [key: string]: string | number | null
}

export interface ParseResult<T> {
  data: T[]
  errors: Array<{ row: number; field: string; message: string }>
  warnings: Array<{ row: number; field: string; message: string }>
}

export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split("\n")
  if (lines.length === 0) return []

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""))

  // Parse rows
  const data: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""))
    const row: CSVRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || null
    })
    data.push(row)
  }

  return data
}

export function convertToCSV<T extends Record<string, any>>(data: T[], columns: string[]): string {
  if (data.length === 0) return ""

  // Create header
  const header = columns.join(",")

  // Create rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col]
        if (value === null || value === undefined) return ""
        // Escape commas and quotes
        const stringValue = String(value)
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(",")
  })

  return [header, ...rows].join("\n")
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} is required`
  }
  return null
}

export function validateEmail(email: string): string | null {
  if (!email) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Invalid email format"
  }
  return null
}

export function validateDate(dateString: string): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return "Invalid date format. Use YYYY-MM-DD"
  }
  return null
}

export function validateNumber(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") return null
  if (isNaN(Number(value))) {
    return `${fieldName} must be a number`
  }
  return null
}
