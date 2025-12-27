/**
 * Format dates for display on Dashboard (DD/MM/YYYY format for Vietnamese users)
 * Database and exports use ISO 8601 (YYYY-MM-DD)
 */

/**
 * Format ISO 8601 date string to DD/MM/YYYY for Dashboard display
 * Example: "2025-01-15" → "15/01/2025"
 */
export function formatForDashboard(isoDate: string | Date): string {
  if (!isoDate) return "N/A"

  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate

  if (isNaN(date.getTime())) {
    return "N/A"
  }

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format ISO 8601 date with time to Vietnamese format
 * Example: "2025-01-15T14:30:45Z" → "15/01/2025, 14:30:45"
 */
export function formatDateTimeForDashboard(isoDateTime: string | Date): string {
  if (!isoDateTime) return "N/A"

  const date = typeof isoDateTime === "string" ? new Date(isoDateTime) : isoDateTime

  if (isNaN(date.getTime())) {
    return "N/A"
  }

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
}

/**
 * Format date to ISO 8601 (YYYY-MM-DD) for database and exports
 */
export function formatToISO8601(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return ""
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Get relative time display (e.g., "2 giờ trước", "Hôm nay")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays === 1) return "Hôm nay"
  if (diffDays === 2) return "Hôm qua"
  if (diffDays < 7) return `${diffDays} ngày trước`

  return formatForDashboard(d)
}
