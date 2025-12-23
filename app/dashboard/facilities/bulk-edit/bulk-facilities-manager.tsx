"use client"

import { BulkUpload } from "@/components/bulk-upload"
import { BulkExport } from "@/components/bulk-export"
import { createClient } from "@/lib/supabase/client"
import { validateRequired } from "@/lib/utils/csv-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FacilityCSV {
  name: string
  facility_type: string
  location_code: string
  address: string
  gps_coordinates?: string
  certification_status?: string
}

const FACILITY_COLUMNS = [
  { key: "name", label: "Facility Name" },
  { key: "facility_type", label: "Type" },
  { key: "location_code", label: "Location Code" },
  { key: "address", label: "Address" },
  { key: "gps_coordinates", label: "GPS Coordinates" },
  { key: "certification_status", label: "Certification Status" },
  { key: "created_at", label: "Created Date" },
]

const TEMPLATE_COLUMNS = [
  "name",
  "facility_type",
  "location_code",
  "address",
  "gps_coordinates",
  "certification_status",
]

export function BulkFacilitiesManager() {
  const supabase = createClient()

  const validateFacilities = async (data: any[]) => {
    const valid: FacilityCSV[] = []
    const errors: Array<{ row: number; field: string; message: string }> = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 for header and 0-index

      // Validate required fields
      const nameError = validateRequired(row.name, "name")
      const typeError = validateRequired(row.facility_type, "facility_type")
      const locationError = validateRequired(row.location_code, "location_code")

      if (nameError) errors.push({ row: rowNum, field: "name", message: nameError })
      if (typeError) errors.push({ row: rowNum, field: "facility_type", message: typeError })
      if (locationError) errors.push({ row: rowNum, field: "location_code", message: locationError })

      if (!nameError && !typeError && !locationError) {
        valid.push({
          name: row.name,
          facility_type: row.facility_type,
          location_code: row.location_code,
          address: row.address || "",
          gps_coordinates: row.gps_coordinates || null,
          certification_status: row.certification_status || "Pending",
        })
      }
    }

    return { valid, errors }
  }

  const uploadFacilities = async (facilities: FacilityCSV[]) => {
    // Get current user's company_id
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (!profile?.company_id) throw new Error("No company found")

    // Insert facilities
    const facilitiesWithCompany = facilities.map((f) => ({
      ...f,
      company_id: profile.company_id,
    }))

    const { error } = await supabase.from("facilities").insert(facilitiesWithCompany)

    if (error) throw error
  }

  const exportFacilities = async (selectedColumns: string[]) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (!profile?.company_id) throw new Error("No company found")

    const { data, error } = await supabase.from("facilities").select("*").eq("company_id", profile.company_id)

    if (error) throw error

    return data || []
  }

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
        <TabsTrigger value="export">Bulk Export</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-6">
        <BulkUpload<FacilityCSV>
          title="Bulk Upload Facilities"
          description="Upload multiple facilities at once using a CSV file"
          templateColumns={TEMPLATE_COLUMNS}
          onValidate={validateFacilities}
          onUpload={uploadFacilities}
        />
      </TabsContent>

      <TabsContent value="export" className="mt-6">
        <BulkExport
          title="Export Facilities"
          description="Export your facilities data to CSV format"
          columns={FACILITY_COLUMNS}
          onFetch={exportFacilities}
          filename={`facilities-export-${new Date().toISOString().split("T")[0]}.csv`}
        />
      </TabsContent>
    </Tabs>
  )
}
