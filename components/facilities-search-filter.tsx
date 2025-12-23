"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DataTableSearch } from "@/components/data-table-search"

export function FacilitiesSearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterConfigs = [
    {
      key: "facility_type",
      label: "Loại cơ sở",
      type: "select" as const,
      options: [
        { value: "farm", label: "Trang trại" },
        { value: "packing_house", label: "Nhà đóng gói" },
        { value: "processor", label: "Nhà xử lý" },
        { value: "warehouse", label: "Kho bảo quản" },
        { value: "distributor", label: "Nhà phân phối" },
        { value: "retailer", label: "Nhà bán lẻ" },
      ],
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "select" as const,
      options: [
        { value: "active", label: "Hoạt động" },
        { value: "inactive", label: "Không hoạt động" },
      ],
    },
  ]

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set("search", query)
    } else {
      params.delete("search")
    }
    router.push(`/dashboard/facilities?${params.toString()}`)
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

    router.push(`/dashboard/facilities?${params.toString()}`)
  }

  return (
    <DataTableSearch
      searchPlaceholder="Tìm kiếm cơ sở theo tên hoặc mã địa điểm..."
      filterConfigs={filterConfigs}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  )
}
