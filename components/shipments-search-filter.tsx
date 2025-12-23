"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DataTableSearch } from "@/components/data-table-search"

export function ShipmentsSearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterConfigs = [
    {
      key: "status",
      label: "Trạng thái",
      type: "select" as const,
      options: [
        { value: "pending", label: "Chờ xử lý" },
        { value: "in_transit", label: "Đang vận chuyển" },
        { value: "delivered", label: "Đã giao" },
        { value: "cancelled", label: "Đã hủy" },
      ],
    },
    {
      key: "shipment_date",
      label: "Ngày xuất hàng",
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
    router.push(`/dashboard/shipments?${params.toString()}`)
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

    router.push(`/dashboard/shipments?${params.toString()}`)
  }

  return (
    <DataTableSearch
      searchPlaceholder="Tìm kiếm theo mã vận đơn hoặc điểm đến..."
      filterConfigs={filterConfigs}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  )
}
