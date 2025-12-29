"use client"

import { BulkUpload } from "@/components/bulk-upload"
import { BulkExport } from "@/components/bulk-export"
import { createClient } from "@/lib/supabase/client"
import { validateRequired } from "@/lib/utils/csv-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductCSV {
  product_code: string
  product_name: string
  product_name_vi?: string
  category: string
  unit_of_measure: string
  is_ftl: boolean
  requires_cte: boolean
  description?: string
}

const PRODUCT_COLUMNS = [
  { key: "product_code", label: "Product Code" },
  { key: "product_name", label: "Product Name (EN)" },
  { key: "product_name_vi", label: "Product Name (VI)" },
  { key: "category", label: "Category" },
  { key: "unit_of_measure", label: "Unit" },
  { key: "is_ftl", label: "FTL Food" },
  { key: "requires_cte", label: "Requires CTE" },
  { key: "description", label: "Description" },
  { key: "created_at", label: "Created Date" },
]

const TEMPLATE_COLUMNS = [
  "product_code",
  "product_name",
  "product_name_vi",
  "category",
  "unit_of_measure",
  "is_ftl",
  "requires_cte",
  "description",
]

export function BulkProductsManager() {
  const supabase = createClient()

  const validateProducts = async (data: any[]) => {
    const valid: ProductCSV[] = []
    const errors: Array<{ row: number; field: string; message: string }> = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2

      // Validate required fields
      const codeError = validateRequired(row.product_code, "product_code")
      const nameError = validateRequired(row.product_name, "product_name")
      const categoryError = validateRequired(row.category, "category")
      const unitError = validateRequired(row.unit_of_measure, "unit_of_measure")

      if (codeError) errors.push({ row: rowNum, field: "product_code", message: codeError })
      if (nameError) errors.push({ row: rowNum, field: "product_name", message: nameError })
      if (categoryError) errors.push({ row: rowNum, field: "category", message: categoryError })
      if (unitError) errors.push({ row: rowNum, field: "unit_of_measure", message: unitError })

      if (!codeError && !nameError && !categoryError && !unitError) {
        valid.push({
          product_code: row.product_code,
          product_name: row.product_name,
          product_name_vi: row.product_name_vi || row.product_name,
          category: row.category,
          unit_of_measure: row.unit_of_measure,
          is_ftl: row.is_ftl === "true" || row.is_ftl === "1" || row.is_ftl === "yes",
          requires_cte: row.requires_cte === "true" || row.requires_cte === "1" || row.requires_cte === "yes",
          description: row.description || null,
        })
      }
    }

    return { valid, errors }
  }

  const uploadProducts = async (products: ProductCSV[]) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (!profile?.company_id) throw new Error("No company found")

    const productsWithCompany = products.map((p) => ({
      ...p,
      company_id: profile.company_id,
    }))

    const { error } = await supabase.from("products").insert(productsWithCompany)

    if (error) throw error
  }

  const exportProducts = async (selectedColumns: string[]) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (!profile?.company_id) throw new Error("No company found")

    const { data, error } = await supabase.from("products").select("*").eq("company_id", profile.company_id)

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
        <BulkUpload<ProductCSV>
          title="Bulk Upload Products"
          description="Upload multiple products at once using a CSV file"
          templateColumns={TEMPLATE_COLUMNS}
          onValidate={validateProducts}
          onUpload={uploadProducts}
        />
      </TabsContent>

      <TabsContent value="export" className="mt-6">
        <BulkExport
          title="Export Products"
          description="Export your products data to CSV format"
          columns={PRODUCT_COLUMNS}
          onFetch={exportProducts}
          filename={`products-export-${new Date().toISOString().split("T")[0]}.csv`}
        />
      </TabsContent>
    </Tabs>
  )
}
