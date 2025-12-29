import { createClient } from "@/lib/supabase/client"

export interface ChronologicalCheckResult {
  valid: boolean
  error?: string
  guidance?: string
  last_event_type?: string
  last_event_date?: string
  time_difference_seconds?: number
  time_since_last_event_seconds?: number
}

/**
 * Check if an event date is chronologically valid
 * Returns false if event date is BEFORE the previous event for this TLC
 * @param tlcId - The TLC ID
 * @param eventType - The event type (harvest, receiving, transformation, etc.)
 * @param eventDate - The proposed event date
 * @returns Validation result with error details if invalid
 */
export async function checkChronologicalValidity(
  tlcId: string,
  eventType: string,
  eventDate: Date,
): Promise<ChronologicalCheckResult> {
  const supabase = createClient()

  try {
    // Call the Supabase RPC function for chronological validation
    const { data, error } = await supabase.rpc("check_tlc_chronological", {
      p_tlc_id: tlcId,
      p_event_type: eventType,
      p_event_date: eventDate.toISOString(),
    })

    if (error) {
      console.error("[v0] Chronological validation error:", error)
      return {
        valid: false,
        error: "Lỗi hệ thống khi kiểm tra chronological validity",
      }
    }

    if (!data) {
      return {
        valid: false,
        error: "Không thể kiểm tra validity",
      }
    }

    // If valid, return success
    if (data.valid) {
      return {
        valid: true,
        last_event_type: data.last_event_type,
        last_event_date: data.last_event_date,
        time_since_last_event_seconds: data.time_since_last_event_seconds,
      }
    }

    // If invalid, return detailed error info
    return {
      valid: false,
      error: data.error || data.warning,
      guidance:
        data.guidance ||
        "Please verify the Operation Log (nhật ký vận hành) and ensure events are in correct chronological order.",
      last_event_type: data.last_event_type,
      last_event_date: data.last_event_date,
      time_difference_seconds: data.time_difference_seconds,
    }
  } catch (err) {
    console.error("[v0] Chronological validity check exception:", err)
    return {
      valid: false,
      error: "Lỗi hệ thống khi kiểm tra chronological validity",
    }
  }
}

/**
 * Get human-readable time difference
 */
export function formatTimeDifference(seconds: number): string {
  if (seconds === 0) return "cùng lúc"

  const isNegative = seconds < 0
  const absSecs = Math.abs(seconds)

  let result = ""
  if (absSecs >= 86400) {
    result = `${Math.floor(absSecs / 86400)} ngày`
  } else if (absSecs >= 3600) {
    result = `${Math.floor(absSecs / 3600)} giờ`
  } else if (absSecs >= 60) {
    result = `${Math.floor(absSecs / 60)} phút`
  } else {
    result = `${absSecs} giây`
  }

  return isNegative ? `${result} trước` : `${result} sau`
}
