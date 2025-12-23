import { createClient } from "@/lib/supabase/server"

export interface SearchResult {
  id: string
  type: "product" | "facility" | "lot" | "shipment" | "report"
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  url: string
}

export interface SearchFilters {
  types?: Array<"product" | "facility" | "lot" | "shipment" | "report">
  dateFrom?: string
  dateTo?: string
  status?: string
  companyId?: string
}

export async function globalSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
  const supabase = await createClient()
  const results: SearchResult[] = []

  const searchTerm = `%${query.toLowerCase()}%`
  const includeTypes = filters?.types || ["product", "facility", "lot", "shipment", "report"]

  // Search Products
  if (includeTypes.includes("product")) {
    const productQuery = supabase
      .from("products")
      .select("id, product_name, product_code, description, is_ftl")
      .or(`product_name.ilike.${searchTerm},product_code.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10)

    if (filters?.companyId) {
      productQuery.eq("company_id", filters.companyId)
    }

    const { data: products } = await productQuery

    products?.forEach((p) => {
      results.push({
        id: p.id,
        type: "product",
        title: p.product_name,
        subtitle: p.product_code,
        description: p.description || undefined,
        metadata: { is_ftl: p.is_ftl },
        url: `/dashboard/products/${p.id}`,
      })
    })
  }

  // Search Facilities
  if (includeTypes.includes("facility")) {
    const facilityQuery = supabase
      .from("facilities")
      .select("id, name, location_code, facility_type, address")
      .or(`name.ilike.${searchTerm},location_code.ilike.${searchTerm},address.ilike.${searchTerm}`)
      .limit(10)

    if (filters?.companyId) {
      facilityQuery.eq("company_id", filters.companyId)
    }

    const { data: facilities } = await facilityQuery

    facilities?.forEach((f) => {
      results.push({
        id: f.id,
        type: "facility",
        title: f.name,
        subtitle: f.location_code,
        description: f.address || undefined,
        metadata: { facility_type: f.facility_type },
        url: `/dashboard/facilities/${f.id}`,
      })
    })
  }

  // Search Traceability Lots
  if (includeTypes.includes("lot")) {
    const lotQuery = supabase
      .from("traceability_lots")
      .select("id, lot_number, status, harvest_date, products(product_name), facilities(name)")
      .or(`lot_number.ilike.${searchTerm}`)
      .limit(10)

    if (filters?.dateFrom) {
      lotQuery.gte("harvest_date", filters.dateFrom)
    }
    if (filters?.dateTo) {
      lotQuery.lte("harvest_date", filters.dateTo)
    }
    if (filters?.status) {
      lotQuery.eq("status", filters.status)
    }

    const { data: lots } = await lotQuery

    lots?.forEach((lot: any) => {
      results.push({
        id: lot.id,
        type: "lot",
        title: lot.lot_number,
        subtitle: lot.products?.product_name,
        description: lot.facilities?.name,
        metadata: { status: lot.status, harvest_date: lot.harvest_date },
        url: `/dashboard/lots/${lot.id}`,
      })
    })
  }

  // Search Shipments
  if (includeTypes.includes("shipment")) {
    const shipmentQuery = supabase
      .from("shipments")
      .select("id, shipment_number, shipment_date, destination, status")
      .or(`shipment_number.ilike.${searchTerm},destination.ilike.${searchTerm}`)
      .limit(10)

    if (filters?.dateFrom) {
      shipmentQuery.gte("shipment_date", filters.dateFrom)
    }
    if (filters?.dateTo) {
      shipmentQuery.lte("shipment_date", filters.dateTo)
    }

    const { data: shipments } = await shipmentQuery

    shipments?.forEach((s) => {
      results.push({
        id: s.id,
        type: "shipment",
        title: s.shipment_number,
        subtitle: new Date(s.shipment_date).toLocaleDateString("vi-VN"),
        description: s.destination || undefined,
        metadata: { status: s.status },
        url: `/dashboard/shipments/${s.id}`,
      })
    })
  }

  // Search Audit Reports
  if (includeTypes.includes("report")) {
    const reportQuery = supabase
      .from("audit_reports")
      .select("id, report_number, audit_date, compliance_status, auditor_name, facilities(name)")
      .or(`report_number.ilike.${searchTerm},auditor_name.ilike.${searchTerm}`)
      .limit(10)

    if (filters?.dateFrom) {
      reportQuery.gte("audit_date", filters.dateFrom)
    }
    if (filters?.dateTo) {
      reportQuery.lte("audit_date", filters.dateTo)
    }

    const { data: reports } = await reportQuery

    reports?.forEach((r: any) => {
      results.push({
        id: r.id,
        type: "report",
        title: r.report_number,
        subtitle: r.auditor_name,
        description: r.facilities?.name,
        metadata: { compliance_status: r.compliance_status, audit_date: r.audit_date },
        url: `/dashboard/reports/${r.id}`,
      })
    })
  }

  return results
}
