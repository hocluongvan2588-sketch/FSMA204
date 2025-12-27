import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * API endpoint to validate chronological ordering of CTE events
 * POST /api/cte/validate-chronological
 *
 * Request body:
 * {
 *   tlcId: string,
 *   eventType: string,
 *   eventDate: string (ISO 8601)
 * }
 *
 * Response: { valid: boolean, error?: string, guidance?: string, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tlcId, eventType, eventDate } = body

    // Validate input
    if (!tlcId || !eventType || !eventDate) {
      return NextResponse.json(
        {
          valid: false,
          error: "Missing required fields: tlcId, eventType, eventDate",
        },
        { status: 400 },
      )
    }

    // Parse event date
    const parsedDate = new Date(eventDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid event date format",
        },
        { status: 400 },
      )
    }

    // Create Supabase client for server-side operations
    const supabase = await createClient()

    // Call the chronological validation RPC function
    const { data, error } = await supabase.rpc("check_tlc_chronological", {
      p_tlc_id: tlcId,
      p_event_type: eventType,
      p_event_date: parsedDate.toISOString(),
    })

    if (error) {
      console.error("[v0] RPC error:", error)
      return NextResponse.json(
        {
          valid: false,
          error: "Database validation error",
        },
        { status: 500 },
      )
    }

    // Return the validation result
    return NextResponse.json(data || { valid: true })
  } catch (error) {
    console.error("[v0] Chronological validation endpoint error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
