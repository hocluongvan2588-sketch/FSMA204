import { exportAuditTrail } from "@/lib/utils/audit-trail"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type") || undefined
    const action = searchParams.get("action") || undefined
    const dateFrom = searchParams.get("date_from") || undefined
    const dateTo = searchParams.get("date_to") || undefined

    const csv = await exportAuditTrail({
      entityType,
      action,
      dateFrom,
      dateTo,
    })

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-trail-${new Date().toISOString()}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export audit trail error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
