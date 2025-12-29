import { createClient } from "@/lib/supabase/server"

export interface AnalyticsData {
  totalProducts: number
  totalFacilities: number
  totalShipments: number
  totalLots: number
  complianceRate: number
  criticalLots: number
  recentActivity: number
}

export interface TimeSeriesData {
  date: string
  count: number
  label?: string
}

export interface ComplianceMetrics {
  compliant: number
  nonCompliant: number
  requiresAction: number
  rate: number
}

export interface FacilityPerformance {
  facilityId: string
  facilityName: string
  totalLots: number
  compliantLots: number
  issues: number
  complianceRate: number
}

export interface ProductTraceability {
  productId: string
  productName: string
  totalLots: number
  avgTraceabilityTime: number
  missingData: number
}

export async function getDashboardAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient()

  const [products, facilities, shipments, lots, recentLots] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("facilities").select("id", { count: "exact", head: true }),
    supabase.from("shipments").select("id", { count: "exact", head: true }),
    supabase.from("traceability_lots").select("id", { count: "exact", head: true }),
    supabase
      .from("traceability_lots")
      .select("id")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const { data: criticalLotsData } = await supabase
    .from("traceability_lots")
    .select("id")
    .or("harvest_date.is.null,cooling_date.is.null,first_receiver_date.is.null")

  return {
    totalProducts: products.count || 0,
    totalFacilities: facilities.count || 0,
    totalShipments: shipments.count || 0,
    totalLots: lots.count || 0,
    complianceRate: 0,
    criticalLots: criticalLotsData?.length || 0,
    recentActivity: recentLots.data?.length || 0,
  }
}

export async function getLotsTimeSeries(days = 30): Promise<TimeSeriesData[]> {
  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data } = await supabase
    .from("traceability_lots")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true })

  const groupedByDate = new Map<string, number>()

  data?.forEach((lot) => {
    const date = new Date(lot.created_at).toISOString().split("T")[0]
    groupedByDate.set(date, (groupedByDate.get(date) || 0) + 1)
  })

  return Array.from(groupedByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}

export async function getComplianceMetrics(): Promise<ComplianceMetrics> {
  const supabase = await createClient()

  const { data: reports } = await supabase.from("audit_reports").select("compliance_status")

  const compliant = reports?.filter((r) => r.compliance_status === "compliant").length || 0
  const nonCompliant = reports?.filter((r) => r.compliance_status === "non_compliant").length || 0
  const requiresAction = reports?.filter((r) => r.compliance_status === "requires_action").length || 0
  const total = reports?.length || 0

  return {
    compliant,
    nonCompliant,
    requiresAction,
    rate: total > 0 ? (compliant / total) * 100 : 0,
  }
}

export async function getFacilityPerformance(): Promise<FacilityPerformance[]> {
  const supabase = await createClient()

  const { data: facilities } = await supabase.from("facilities").select(`
      id,
      name,
      traceability_lots(id)
    `)

  const { data: reports } = await supabase.from("audit_reports").select("facility_id, compliance_status")

  const performanceData: FacilityPerformance[] =
    facilities?.map((facility) => {
      const facilityReports = reports?.filter((r) => r.facility_id === facility.id) || []
      const compliant = facilityReports.filter((r) => r.compliance_status === "compliant").length
      const total = facilityReports.length

      return {
        facilityId: facility.id,
        facilityName: facility.name,
        totalLots: facility.traceability_lots?.length || 0,
        compliantLots: compliant,
        issues: facilityReports.filter((r) => r.compliance_status !== "compliant").length,
        complianceRate: total > 0 ? (compliant / total) * 100 : 0,
      }
    }) || []

  return performanceData.sort((a, b) => b.complianceRate - a.complianceRate)
}

export async function getProductTraceability(): Promise<ProductTraceability[]> {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select(`
      id,
      name,
      traceability_lots(
        id,
        harvest_date,
        cooling_date,
        first_receiver_date
      )
    `)

  const traceabilityData: ProductTraceability[] =
    products?.map((product) => {
      const lots = product.traceability_lots || []
      const missingData = lots.filter(
        (lot: any) => !lot.harvest_date || !lot.cooling_date || !lot.first_receiver_date,
      ).length

      return {
        productId: product.id,
        productName: product.name,
        totalLots: lots.length,
        avgTraceabilityTime: 0,
        missingData,
      }
    }) || []

  return traceabilityData.sort((a, b) => b.totalLots - a.totalLots)
}

export async function getShipmentTimeSeries(days = 30): Promise<TimeSeriesData[]> {
  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data } = await supabase
    .from("shipments")
    .select("shipment_date")
    .gte("shipment_date", startDate.toISOString().split("T")[0])
    .order("shipment_date", { ascending: true })

  const groupedByDate = new Map<string, number>()

  data?.forEach((shipment) => {
    const date = shipment.shipment_date
    groupedByDate.set(date, (groupedByDate.get(date) || 0) + 1)
  })

  return Array.from(groupedByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}
