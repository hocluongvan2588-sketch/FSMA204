"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DataTableSearch } from "@/components/data-table-search"

interface LotsSearchFilterProps {
  products: Array<{ id: string; product_name: string }>
}

export function LotsSearchFilter({ products }: LotsSearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterConfigs = [
    {
      key: "status",
      label: "Trạng thái",
      type: "select" as const,
      options: [
        { value: "active", label: "Hoạt động" },
        { value: "expired", label: "Hết hạn" },
        { value: "depleted", label: "Đã dùng hết" },
        { value: "recalled", label: "Thu hồi" },
      ],
    },
    {
      key: "product",
      label: "Sản phẩm",
      type: "select" as const,
      options: products.map((p) => ({ value: p.id, label: p.product_name })),
    },
    {
      key: "production_date",
      label: "Ngày sản xuất",
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
    router.push(`/dashboard/lots?${params.toString()}`)
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

    router.push(`/dashboard/lots?${params.toString()}`)
  }

  return (
    <DataTableSearch
      searchPlaceholder="Tìm kiếm theo TLC hoặc số lô..."
      filterConfigs={filterConfigs}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  )
}
