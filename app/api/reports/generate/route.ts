import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { reportType } = await request.json()
    const supabase = await createClient()

    let reportData: any = {}
    let reportTitle = ""

    switch (reportType) {
      case "ftl_products":
        reportTitle = "Food Traceability List (FTL) - FSMA 204 Report"
        reportData = await generateFTLReportData(supabase)
        break
      case "tlc_traceability":
        reportTitle = "Traceability Lot Code (TLC) Report - FSMA 204"
        reportData = await generateTLCReportData(supabase)
        break
      case "cte_events":
        reportTitle = "Critical Tracking Events (CTE) Report - FSMA 204"
        reportData = await generateCTEReportData(supabase)
        break
      case "compliance_status":
        reportTitle = "FSMA 204 Compliance Status Report"
        reportData = await generateComplianceReportData(supabase)
        break
      default:
        throw new Error("Unknown report type")
    }

    return NextResponse.json({
      title: reportTitle,
      data: reportData,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Report data fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function generateFTLReportData(supabase: any): Promise<any> {
  const { data: products } = await supabase.from("products").select("*").limit(100)
  return { products: products || [] }
}

async function generateTLCReportData(supabase: any): Promise<any> {
  const { data: lots } = await supabase.from("traceability_lots").select("*, products(product_name)").limit(100)
  return { lots: lots || [] }
}

async function generateCTEReportData(supabase: any): Promise<any> {
  const { data: ctes } = await supabase
    .from("critical_tracking_events")
    .select("*")
    .order("event_time", { ascending: false })
    .limit(100)
  return { ctes: ctes || [] }
}

async function generateComplianceReportData(supabase: any): Promise<any> {
  const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true })
  const { count: lotCount } = await supabase.from("traceability_lots").select("*", { count: "exact", head: true })
  const { count: cteCount } = await supabase
    .from("critical_tracking_events")
    .select("*", { count: "exact", head: true })
  const { count: shipmentCount } = await supabase.from("shipments").select("*", { count: "exact", head: true })

  return {
    productCount: productCount || 0,
    lotCount: lotCount || 0,
    cteCount: cteCount || 0,
    shipmentCount: shipmentCount || 0,
  }
}
