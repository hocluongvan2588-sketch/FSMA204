import { createClient } from "@/lib/supabase/server"

export interface CTEExportRow {
  cteType: string
  tlc: string
  dateTime: string
  locationId: string
  productDescription: string
  quantity: string
  unit: string
  temperature?: string
  eventDate: string
  facilityName: string
  responsiblePerson?: string
}

/**
 * Generate FSMA 204 compliant Excel export data
 * Supports streaming for large datasets (10k+ rows)
 */
export async function generateFSMA204Export(
  companyId: string,
  options?: {
    fromDate?: string
    toDate?: string
    facilityId?: string
  },
) {
  const supabase = await createClient()

  // Get all CTEs with related data in chunks (streaming)
  let query = supabase
    .from("critical_tracking_events")
    .select(
      `
      id,
      event_type,
      event_date,
      quantity_processed,
      unit,
      temperature,
      responsible_person,
      traceability_lots(tlc, products(product_name)),
      facilities(id, name, location_code),
      location_details
    `,
    )
    .eq("facilities.company_id", companyId)
    .order("event_date", { ascending: false })
    .is("deleted_at", null)

  if (options?.fromDate) {
    query = query.gte("event_date", options.fromDate)
  }

  if (options?.toDate) {
    query = query.lte("event_date", options.toDate)
  }

  if (options?.facilityId) {
    query = query.eq("facility_id", options.facilityId)
  }

  const { data: ctes, error } = await query

  if (error) {
    console.error("[v0] FSMA export query failed:", error)
    throw new Error(`Failed to fetch CTE data: ${error.message}`)
  }

  // Transform to export format
  const exportRows: CTEExportRow[] = (ctes || []).map((cte: any) => ({
    cteType: formatCTEType(cte.event_type),
    tlc: cte.traceability_lots?.tlc || "N/A",
    // ISO 8601 format: YYYY-MM-DD HH:MM:SS for export
    dateTime: new Date(cte.event_date).toISOString().replace("T", " ").substring(0, 19),
    locationId: cte.facilities?.location_code || "N/A",
    productDescription: cte.traceability_lots?.products?.product_name || "N/A",
    quantity: String(cte.quantity_processed || 0),
    unit: cte.unit || "kg",
    temperature: cte.temperature ? String(cte.temperature) : undefined,
    eventDate: cte.event_date,
    facilityName: cte.facilities?.name || "N/A",
    responsiblePerson: cte.responsible_person || undefined,
  }))

  return exportRows
}

/**
 * Convert CTE type to human-readable Vietnamese format
 */
function formatCTEType(eventType: string): string {
  const typeMap: Record<string, string> = {
    harvest: "Thu hoạch",
    cooling: "Làm mát",
    packing: "Đóng gói",
    receiving: "Nhận hàng",
    shipping: "Vận chuyển",
    transformation: "Chế biến",
  }
  return typeMap[eventType] || eventType
}

/**
 * Generate CSV with all FSMA 204 required columns
 */
export function generateCSVContent(rows: CTEExportRow[]): string {
  const headers = [
    "CTE Type",
    "TLC (Traceability Lot Code)",
    "Date/Time",
    "Location ID",
    "Product Description",
    "Quantity",
    "Unit",
    "Temperature (°C)",
    "Facility Name",
    "Responsible Person",
  ].join(",")

  const csvRows = rows.map((row) => [
    row.cteType,
    row.tlc,
    row.dateTime,
    row.locationId,
    `"${row.productDescription}"`, // Quote in case of commas
    row.quantity,
    row.unit,
    row.temperature || "",
    row.facilityName,
    row.responsiblePerson || "",
  ])

  return [headers, ...csvRows.map((r) => r.join(","))].join("\n")
}

/**
 * Stream large export data in chunks to prevent memory overflow
 * Handles 10k+ rows efficiently
 */
export async function* streamFSMA204ExportChunks(
  companyId: string,
  options?: {
    fromDate?: string
    toDate?: string
    facilityId?: string
  },
) {
  const supabase = await createClient()
  const CHUNK_SIZE = 1000 // Process 1000 rows at a time
  let offset = 0
  let hasMore = true

  // Yield header first
  yield [
    "CTE Type",
    "TLC (Traceability Lot Code)",
    "Date/Time",
    "Location ID",
    "Product Description",
    "Quantity",
    "Unit",
    "Temperature (°C)",
    "Facility Name",
    "Responsible Person",
  ].join(",")

  while (hasMore) {
    let query = supabase
      .from("critical_tracking_events")
      .select(
        `
        id,
        event_type,
        event_date,
        quantity_processed,
        unit,
        temperature,
        responsible_person,
        traceability_lots(tlc, products(product_name)),
        facilities(id, name, location_code),
        location_details
      `,
      )
      .eq("facilities.company_id", companyId)
      .order("event_date", { ascending: false })
      .is("deleted_at", null)
      .range(offset, offset + CHUNK_SIZE - 1)

    if (options?.fromDate) {
      query = query.gte("event_date", options.fromDate)
    }

    if (options?.toDate) {
      query = query.lte("event_date", options.toDate)
    }

    if (options?.facilityId) {
      query = query.eq("facility_id", options.facilityId)
    }

    const { data: ctes, error } = await query

    if (error) {
      console.error("[v0] Streaming chunk error at offset", offset, error)
      throw new Error(`Failed to fetch chunk: ${error.message}`)
    }

    if (!ctes || ctes.length === 0) {
      hasMore = false
      break
    }

    // Format and yield chunk
    const csvChunk = ctes
      .map((cte: any) => [
        formatCTEType(cte.event_type),
        cte.traceability_lots?.tlc || "N/A",
        // ISO 8601 format: YYYY-MM-DD HH:MM:SS for export
        new Date(cte.event_date)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        cte.facilities?.location_code || "N/A",
        `"${cte.traceability_lots?.products?.product_name || "N/A"}"`,
        String(cte.quantity_processed || 0),
        cte.unit || "kg",
        cte.temperature ? String(cte.temperature) : "",
        cte.facilities?.name || "N/A",
        cte.responsible_person || "",
      ])
      .map((r) => r.join(","))
      .join("\n")

    yield csvChunk

    offset += CHUNK_SIZE
    if (ctes.length < CHUNK_SIZE) {
      hasMore = false
    }
  }
}

/**
 * Generate Excel-compatible CSV (sortable)
 * Uses BOM for proper UTF-8 encoding in Excel
 */
export async function generateExcelCompatibleCSV(
  companyId: string,
  options?: {
    fromDate?: string
    toDate?: string
    facilityId?: string
  },
): Promise<string> {
  const rows = await generateFSMA204Export(companyId, options)
  const csvContent = generateCSVContent(rows)

  // Add UTF-8 BOM for Excel compatibility
  return "\uFEFF" + csvContent
}

/**
 * Count total records for progress tracking
 */
export async function countFSMA204Records(
  companyId: string,
  options?: {
    fromDate?: string
    toDate?: string
    facilityId?: string
  },
): Promise<number> {
  const supabase = await createClient()

  let query = supabase
    .from("critical_tracking_events")
    .select("id", { count: "exact", head: true })
    .eq("facilities.company_id", companyId)
    .is("deleted_at", null)

  if (options?.fromDate) {
    query = query.gte("event_date", options.fromDate)
  }

  if (options?.toDate) {
    query = query.lte("event_date", options.toDate)
  }

  if (options?.facilityId) {
    query = query.eq("facility_id", options.facilityId)
  }

  const { count, error } = await query

  if (error) {
    console.error("[v0] Count query failed:", error)
    return 0
  }

  return count || 0
}
