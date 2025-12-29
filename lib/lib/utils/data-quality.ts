import { createClient } from "@/lib/supabase/server"

export interface DataQualityIssue {
  type: "missing_data" | "duplicate" | "invalid_format" | "inconsistent" | "outdated"
  severity: "critical" | "high" | "medium" | "low"
  entity: string
  entityId: string
  field: string
  message: string
  suggestion?: string
}

export interface DataQualityReport {
  totalIssues: number
  criticalIssues: number
  highIssues: number
  issues: DataQualityIssue[]
  score: number
}

export async function runDataQualityChecks(): Promise<DataQualityReport> {
  const supabase = await createClient()
  const issues: DataQualityIssue[] = []

  // Check for lots with missing critical data
  const { data: lotsWithMissingData } = await supabase
    .from("traceability_lots")
    .select("id, tlc, harvest_date, cooling_date, first_receiver_date")
    .or("harvest_date.is.null,cooling_date.is.null,first_receiver_date.is.null")

  lotsWithMissingData?.forEach((lot) => {
    if (!lot.harvest_date) {
      issues.push({
        type: "missing_data",
        severity: "critical",
        entity: "traceability_lot",
        entityId: lot.id,
        field: "harvest_date",
        message: `Lô ${lot.tlc} thiếu ngày thu hoạch`,
        suggestion: "Cập nhật ngày thu hoạch để tuân thủ FSMA 204",
      })
    }
    if (!lot.cooling_date) {
      issues.push({
        type: "missing_data",
        severity: "high",
        entity: "traceability_lot",
        entityId: lot.id,
        field: "cooling_date",
        message: `Lô ${lot.tlc} thiếu ngày làm lạnh`,
        suggestion: "Thêm ngày làm lạnh nếu áp dụng",
      })
    }
  })

  // Check for duplicate product codes
  const { data: products } = await supabase.from("products").select("product_code, id, product_name")

  const productCodeMap = new Map<string, string[]>()
  products?.forEach((p) => {
    const ids = productCodeMap.get(p.product_code) || []
    ids.push(p.id)
    productCodeMap.set(p.product_code, ids)
  })

  productCodeMap.forEach((ids, code) => {
    if (ids.length > 1) {
      issues.push({
        type: "duplicate",
        severity: "high",
        entity: "product",
        entityId: ids[0],
        field: "product_code",
        message: `Mã sản phẩm "${code}" bị trùng lặp (${ids.length} lần)`,
        suggestion: "Cập nhật mã sản phẩm để đảm bảo tính duy nhất",
      })
    }
  })

  // Check for duplicate facility location codes
  const { data: facilities } = await supabase.from("facilities").select("location_code, id, name")

  const facilityCodeMap = new Map<string, string[]>()
  facilities?.forEach((f) => {
    const ids = facilityCodeMap.get(f.location_code) || []
    ids.push(f.id)
    facilityCodeMap.set(f.location_code, ids)
  })

  facilityCodeMap.forEach((ids, code) => {
    if (ids.length > 1) {
      issues.push({
        type: "duplicate",
        severity: "critical",
        entity: "facility",
        entityId: ids[0],
        field: "location_code",
        message: `Mã địa điểm "${code}" bị trùng lặp (${ids.length} lần)`,
        suggestion: "Mã địa điểm phải là duy nhất theo FSMA 204",
      })
    }
  })

  // Check for facilities with missing contact info
  const { data: facilitiesNoContact } = await supabase
    .from("facilities")
    .select("id, name, contact_email, contact_phone")
    .or("contact_email.is.null,contact_phone.is.null")

  facilitiesNoContact?.forEach((facility) => {
    if (!facility.contact_email && !facility.contact_phone) {
      issues.push({
        type: "missing_data",
        severity: "medium",
        entity: "facility",
        entityId: facility.id,
        field: "contact_info",
        message: `Cơ sở "${facility.name}" thiếu thông tin liên hệ`,
        suggestion: "Thêm email hoặc số điện thoại liên hệ",
      })
    }
  })

  // Check for shipments with missing tracking info
  const { data: shipmentsNoTracking } = await supabase
    .from("shipments")
    .select("id, shipment_number, carrier_name, tracking_number")
    .or("carrier_name.is.null,tracking_number.is.null")

  shipmentsNoTracking?.forEach((shipment) => {
    if (!shipment.tracking_number) {
      issues.push({
        type: "missing_data",
        severity: "medium",
        entity: "shipment",
        entityId: shipment.id,
        field: "tracking_number",
        message: `Vận đơn ${shipment.shipment_number} thiếu mã theo dõi`,
        suggestion: "Thêm mã theo dõi để giám sát vận chuyển",
      })
    }
  })

  const criticalIssues = issues.filter((i) => i.severity === "critical").length
  const highIssues = issues.filter((i) => i.severity === "high").length
  const totalIssues = issues.length

  // Calculate quality score (100 - deductions)
  const score = Math.max(
    0,
    100 - criticalIssues * 10 - highIssues * 5 - (totalIssues - criticalIssues - highIssues) * 2,
  )

  return {
    totalIssues,
    criticalIssues,
    highIssues,
    issues,
    score,
  }
}

export async function checkDuplicates(
  table: string,
  field: string,
  value: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase.from(table).select("id").eq(field, value)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  return (data?.length || 0) > 0
}
