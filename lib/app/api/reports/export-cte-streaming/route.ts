import { type NextRequest, NextResponse } from "next/server"
import { streamFSMA204ExportChunks } from "@/lib/utils/fsma-export"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/reports/export-cte-streaming
 * Streams CTE data in chunks to handle 10k+ rows efficiently
 * Prevents memory overflow and ensures data availability within 24h
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user and company
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company associated" }, { status: 403 })
    }

    // Parse query parameters from request URL
    const url = new URL(request.url)
    const fromDate = url.searchParams.get("fromDate") || undefined
    const toDate = url.searchParams.get("toDate") || undefined
    const facilityId = url.searchParams.get("facilityId") || undefined

    const generator = streamFSMA204ExportChunks(profile.company_id, {
      fromDate,
      toDate,
      facilityId,
    })

    // Create readable stream from async generator
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            controller.enqueue(chunk + "\n")
            // Add small delay to prevent overwhelming the browser
            await new Promise((resolve) => setTimeout(resolve, 10))
          }
          controller.close()
        } catch (error: any) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fsma204-cte-export-streaming-${new Date().toISOString().split("T")[0]}.csv"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("[v0] Streaming export error:", error)
    return NextResponse.json({ error: error.message || "Streaming export failed" }, { status: 500 })
  }
}
