/**
 * FSMA 204 Temperature Validation for Cooling Events
 * Validates cooling temperatures against product-specific safety limits
 */

import { createClient } from "@/lib/supabase/client"

export interface TemperatureValidationResult {
  valid: boolean
  error?: string
  warning?: string
  temperature?: number
  maxAllowed?: number
  productName?: string
}

/**
 * FDA food safety temperature limits by product category
 * Source: FDA Food Code 2017, FSMA 204 guidance
 */
const TEMPERATURE_LIMITS: Record<string, { max: number; unit: string; category: string }> = {
  // Leafy greens (lettuce, spinach, kale, herbs)
  leafy: { max: 5, unit: "°C", category: "Leafy Greens" },
  lettuce: { max: 5, unit: "°C", category: "Leafy Greens" },
  spinach: { max: 5, unit: "°C", category: "Leafy Greens" },
  kale: { max: 5, unit: "°C", category: "Leafy Greens" },
  herbs: { max: 5, unit: "°C", category: "Leafy Greens" },

  // Soft fruits (berries, stone fruits)
  berry: { max: 4, unit: "°C", category: "Soft Fruits" },
  strawberry: { max: 2, unit: "°C", category: "Berries" },
  raspberry: { max: 2, unit: "°C", category: "Berries" },
  blueberry: { max: 4, unit: "°C", category: "Berries" },
  peach: { max: 5, unit: "°C", category: "Stone Fruits" },
  plum: { max: 5, unit: "°C", category: "Stone Fruits" },

  // Tropical fruits
  mango: { max: 13, unit: "°C", category: "Tropical Fruits" },
  pineapple: { max: 10, unit: "°C", category: "Tropical Fruits" },
  papaya: { max: 13, unit: "°C", category: "Tropical Fruits" },

  // Tomatoes
  tomato: { max: 13, unit: "°C", category: "Tomatoes" },

  // Cucumbers & melons
  cucumber: { max: 10, unit: "°C", category: "Cucurbits" },
  melon: { max: 7, unit: "°C", category: "Melons" },
  watermelon: { max: 10, unit: "°C", category: "Melons" },

  // Default for unlisted products
  default: { max: 7, unit: "°C", category: "General Produce" },
}

/**
 * Get temperature limit for a product by name
 */
function getTemperatureLimit(productName: string): { max: number; unit: string; category: string } {
  const lowerName = productName.toLowerCase()

  // Check for exact matches first
  for (const [key, limit] of Object.entries(TEMPERATURE_LIMITS)) {
    if (lowerName.includes(key)) {
      return limit
    }
  }

  // Return default if no match
  return TEMPERATURE_LIMITS.default
}

/**
 * Validate cooling temperature against FDA limits
 * @param temperature - Temperature in Celsius
 * @param productId - Product ID to fetch product details
 * @param eventType - Event type (cooling, initial_packing, etc)
 * @returns Validation result with detailed error/warning messages
 */
export async function validateCoolingTemperature(
  temperature: number | null | undefined,
  productId: string | null,
  eventType: string,
): Promise<TemperatureValidationResult> {
  // Temperature validation only applies to cooling and initial_packing events
  if (eventType !== "cooling" && eventType !== "initial_packing") {
    return { valid: true }
  }

  // Temperature is required for cooling events
  if (temperature === null || temperature === undefined) {
    return {
      valid: false,
      error: `FSMA 204 VIOLATION: Nhiệt độ làm lạnh là bắt buộc cho sự kiện ${eventType}. Vui lòng nhập nhiệt độ theo quy định FDA Food Safety.`,
    }
  }

  // Temperature must be numeric and reasonable
  if (isNaN(temperature)) {
    return {
      valid: false,
      error: "Nhiệt độ không hợp lệ. Vui lòng nhập giá trị số.",
    }
  }

  // Sanity check: temperature must be between -20°C and 40°C
  if (temperature < -20 || temperature > 40) {
    return {
      valid: false,
      error: `Nhiệt độ ${temperature}°C nằm ngoài khoảng hợp lý (-20°C đến 40°C). Vui lòng kiểm tra lại.`,
    }
  }

  // If no product specified, use default limit
  if (!productId) {
    const defaultLimit = TEMPERATURE_LIMITS.default
    if (temperature > defaultLimit.max) {
      return {
        valid: false,
        error: `FOOD SAFETY VIOLATION: Nhiệt độ làm lạnh ${temperature}°C vượt quá giới hạn mặc định ${defaultLimit.max}°C. Nhiệt độ quá cao có thể gây hỏng sản phẩm và vi phạm FDA Food Code.`,
        temperature,
        maxAllowed: defaultLimit.max,
      }
    }
    return { valid: true, temperature, maxAllowed: defaultLimit.max }
  }

  // Fetch product details to determine temperature limit
  const supabase = createClient()
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("product_name")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    console.warn("[v0] Could not fetch product for temperature validation:", productError)
    // Fallback to default limit if product not found
    const defaultLimit = TEMPERATURE_LIMITS.default
    if (temperature > defaultLimit.max) {
      return {
        valid: false,
        error: `FOOD SAFETY VIOLATION: Nhiệt độ làm lạnh ${temperature}°C vượt quá giới hạn mặc định ${defaultLimit.max}°C.`,
        temperature,
        maxAllowed: defaultLimit.max,
      }
    }
    return { valid: true, temperature, maxAllowed: defaultLimit.max }
  }

  // Get product-specific temperature limit
  const limit = getTemperatureLimit(product.product_name)

  // Check if temperature exceeds limit
  if (temperature > limit.max) {
    return {
      valid: false,
      error: `FOOD SAFETY VIOLATION: Nhiệt độ làm lạnh ${temperature}°C vượt quá giới hạn ${limit.max}°C cho sản phẩm "${product.product_name}" (${limit.category}). Theo FDA Food Code, nhiệt độ quá cao có thể gây hỏng sản phẩm và vi phạm an toàn thực phẩm.`,
      temperature,
      maxAllowed: limit.max,
      productName: product.product_name,
    }
  }

  // Warning if temperature is close to limit (within 2°C)
  if (temperature > limit.max - 2) {
    return {
      valid: true,
      warning: `Cảnh báo: Nhiệt độ ${temperature}°C gần đạt giới hạn ${limit.max}°C cho "${product.product_name}". Khuyến nghị giảm nhiệt độ để đảm bảo an toàn thực phẩm.`,
      temperature,
      maxAllowed: limit.max,
      productName: product.product_name,
    }
  }

  // All checks passed
  return {
    valid: true,
    temperature,
    maxAllowed: limit.max,
    productName: product.product_name,
  }
}

/**
 * Validate temperature for batch of events
 */
export async function validateBatchTemperatures(
  events: Array<{ temperature: number | null; productId: string | null; eventType: string }>,
): Promise<TemperatureValidationResult[]> {
  return Promise.all(events.map((e) => validateCoolingTemperature(e.temperature, e.productId, e.eventType)))
}
