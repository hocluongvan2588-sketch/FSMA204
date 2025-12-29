import type { PostgrestError } from "@supabase/supabase-js"

export interface ValidationRule {
  field: string
  rule: "required" | "email" | "phone" | "url" | "numeric" | "date" | "minLength" | "maxLength" | "pattern"
  value?: any
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateData(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {}

  rules.forEach((rule) => {
    const value = data[rule.field]

    switch (rule.rule) {
      case "required":
        if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
          errors[rule.field] = rule.message || `${rule.field} là bắt buộc`
        }
        break

      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[rule.field] = rule.message || "Email không hợp lệ"
        }
        break

      case "phone":
        if (value && !/^[\d\s\-+$$$$]+$/.test(value)) {
          errors[rule.field] = rule.message || "Số điện thoại không hợp lệ"
        }
        break

      case "url":
        try {
          if (value) new URL(value)
        } catch {
          errors[rule.field] = rule.message || "URL không hợp lệ"
        }
        break

      case "numeric":
        if (value && isNaN(Number(value))) {
          errors[rule.field] = rule.message || "Phải là số"
        }
        break

      case "date":
        if (value && isNaN(Date.parse(value))) {
          errors[rule.field] = rule.message || "Ngày không hợp lệ"
        }
        break

      case "minLength":
        if (value && value.length < (rule.value || 0)) {
          errors[rule.field] = rule.message || `Tối thiểu ${rule.value} ký tự`
        }
        break

      case "maxLength":
        if (value && value.length > (rule.value || 0)) {
          errors[rule.field] = rule.message || `Tối đa ${rule.value} ký tự`
        }
        break

      case "pattern":
        if (value && rule.value && !new RegExp(rule.value).test(value)) {
          errors[rule.field] = rule.message || "Định dạng không hợp lệ"
        }
        break
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const PRODUCT_VALIDATION_RULES: ValidationRule[] = [
  { field: "product_name", rule: "required" },
  { field: "product_code", rule: "required" },
  { field: "product_code", rule: "pattern", value: "^[A-Z0-9-]+$", message: "Chỉ chữ in hoa, số và dấu gạch ngang" },
  { field: "category", rule: "required" },
  { field: "unit_of_measure", rule: "required" },
]

export const FACILITY_VALIDATION_RULES: ValidationRule[] = [
  { field: "name", rule: "required" },
  { field: "location_code", rule: "required" },
  {
    field: "location_code",
    rule: "pattern",
    value: "^[A-Z0-9-]+$",
    message: "Chỉ chữ in hoa, số và dấu gạch ngang",
  },
  { field: "facility_type", rule: "required" },
  { field: "address", rule: "required" },
  { field: "contact_email", rule: "email" },
  { field: "contact_phone", rule: "phone" },
]

export const LOT_VALIDATION_RULES: ValidationRule[] = [
  { field: "tlc", rule: "required" },
  { field: "product_id", rule: "required" },
  { field: "facility_id", rule: "required" },
  { field: "production_date", rule: "required" },
  { field: "production_date", rule: "date" },
  { field: "quantity", rule: "required" },
  { field: "quantity", rule: "numeric" },
]

export const SHIPMENT_VALIDATION_RULES: ValidationRule[] = [
  { field: "shipment_number", rule: "required" },
  { field: "lot_id", rule: "required" },
  { field: "from_facility_id", rule: "required" },
  { field: "shipment_date", rule: "required" },
  { field: "shipment_date", rule: "date" },
  { field: "destination_address", rule: "required" },
]

export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join("\n")
}

export function isSupabaseError(error: any): error is PostgrestError {
  return error && typeof error === "object" && "code" in error && "message" in error
}
