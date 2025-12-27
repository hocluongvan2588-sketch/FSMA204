import { type NextRequest, NextResponse } from "next/server"
import { generateExcelCompatibleCSV, countFSMA204Records } from "@/lib/utils/fsma-export"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/reports/export-cte
 * Exports CTE data in sortable CSV format
 * Supports streaming for large datasets
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

    const url = new URL(request.url)
    const fromDate = url.searchParams.get("fromDate") || undefined
    const toDate = url.searchParams.get("toDate") || undefined
    const facilityId = url.searchParams.get("facilityId") || undefined

    // Generate CSV content with streaming support
    const csvContent = await generateExcelCompatibleCSV(profile.company_id, {
      fromDate: fromDate,
      toDate: toDate,
      facilityId: facilityId,
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fsma204-cte-export-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("[v0] CTE export error:", error)
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 })
  }
}

/**
 * GET /api/reports/export-cte/status
 * Returns record count for progress tracking
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    const url = new URL(request.url)
    const fromDate = url.searchParams.get("fromDate") || undefined
    const toDate = url.searchParams.get("toDate") || undefined
    const facilityId = url.searchParams.get("facilityId") || undefined

    const totalRecords = await countFSMA204Records(profile.company_id, {
      fromDate: fromDate,
      toDate: toDate,
      facilityId: facilityId,
    })

    return NextResponse.json({
      totalRecords,
      status: "ready",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json({ error: error.message || "Status check failed" }, { status: 500 })
  }
}
