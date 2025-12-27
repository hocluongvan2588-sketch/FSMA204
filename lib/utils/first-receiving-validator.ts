import type { createBrowserClient } from "@supabase/ssr"

/**
 * Validates that First_Receiving events have required exporter facility information
 * FSMA 204 requirement: Must capture exporter facility identifier for imported foods
 */

export interface FirstReceivingKDE {
  exporter_facility_code: string
  exporter_name: string
  exporter_country: string
  port_of_entry?: string
  date_of_entry: string
}

export interface FirstReceivingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate First_Receiving KDE fields
 */
export async function validateFirstReceivingKDE(
  kdeValues: Record<string, string>,
  organizationType: string,
): Promise<FirstReceivingValidation> {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields for all First_Receiving events
  const requiredFields = [
    { key: "exporter_facility_code", label: "Mã cơ sở xuất khẩu" },
    { key: "exporter_name", label: "Tên công ty xuất khẩu" },
    { key: "exporter_country", label: "Quốc gia xuất xứ" },
    { key: "date_of_entry", label: "Ngày giờ nhập cảng" },
  ]

  // Additional required field for Port organizations
  if (organizationType === "port") {
    requiredFields.push({ key: "port_of_entry", label: "Cảng nhập cảnh" })
  }

  // Validate required fields
  for (const field of requiredFields) {
    const value = kdeValues[field.key]
    if (!value || value.trim() === "") {
      errors.push(`${field.label} là bắt buộc đối với First_Receiving`)
    } else {
      // Additional validation by field type
      if (field.key === "exporter_facility_code") {
        if (value.length < 3) {
          errors.push(`${field.label} phải có ít nhất 3 ký tự`)
        }
        // FDA format validation (typically 5-10 digit format)
        if (!/^[A-Z0-9-]{3,}$/.test(value.toUpperCase())) {
          warnings.push(`${field.label} không đúng định dạng FDA tiêu chuẩn`)
        }
      }

      if (field.key === "exporter_country") {
        if (!/^[A-Z]{2}$/.test(value.toUpperCase())) {
          errors.push(`${field.label} phải là mã quốc gia ISO 2 chữ cái (ví dụ: VN, TH, CN)`)
        }
      }

      if (field.key === "date_of_entry") {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          errors.push(`${field.label} không hợp lệ`)
        }
        // Check if date is in future
        if (date > new Date()) {
          errors.push(`${field.label} không được là ngày trong tương lai`)
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check if facility identifier is already registered in system
 */
export async function validateExporterFacilityExists(
  facilityCode: string,
  supabase: ReturnType<typeof createBrowserClient>,
): Promise<boolean> {
  const { data } = await supabase
    .from("facilities")
    .select("id")
    .eq("location_code", facilityCode)
    .eq("is_exporter", true)
    .single()

  return !!data
}

/**
 * Get formatted First_Receiving KDE summary for display
 */
export function formatFirstReceivingKDESummary(kdeValues: Record<string, string>): string {
  const lines = [
    `Nhà xuất khẩu: ${kdeValues.exporter_name}`,
    `Mã cơ sở: ${kdeValues.exporter_facility_code}`,
    `Quốc gia: ${kdeValues.exporter_country}`,
    `Ngày nhập cảng: ${new Date(kdeValues.date_of_entry).toLocaleString("vi-VN")}`,
  ]

  if (kdeValues.port_of_entry) {
    lines.push(`Cảng: ${kdeValues.port_of_entry}`)
  }

  return lines.join("\n")
}
