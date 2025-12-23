"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DataTableSearch } from "@/components/data-table-search"

export function ReportsSearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterConfigs = [
    {
      key: "compliance_status",
      label: "Trạng thái tuân thủ",
      type: "select" as const,
      options: [
        { value: "compliant", label: "Tuân thủ" },
        { value: "non_compliant", label: "Không tuân thủ" },
        { value: "requires_action", label: "Cần hành động" },
      ],
    },
    {
      key: "report_type",
      label: "Loại báo cáo",
      type: "select" as const,
      options: [
        { value: "internal", label: "Nội bộ" },
        { value: "external", label: "Bên ngoài" },
        { value: "regulatory", label: "Cơ quan quản lý" },
        { value: "compliance", label: "Tuân thủ" },
      ],
    },
    {
      key: "audit_date",
      label: "Ngày kiểm toán",
      type: "daterange" as const,
    },
  ]

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set("search", query)
    } else {
      params.delete("search")
    }
    router.push(`/dashboard/reports?${params.toString()}`)
  }

  const handleFilter = (filters: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/dashboard/reports?${params.toString()}`)
  }

  return (
    <DataTableSearch
      searchPlaceholder="Tìm kiếm báo cáo theo số hoặc kiểm toán viên..."
      filterConfigs={filterConfigs}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  )
}
