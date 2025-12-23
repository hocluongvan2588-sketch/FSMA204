"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DataTableSearch } from "@/components/data-table-search"

export function ProductsSearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterConfigs = [
    {
      key: "category",
      label: "Danh mục",
      type: "select" as const,
      options: [
        { value: "fruits", label: "Trái cây" },
        { value: "vegetables", label: "Rau củ" },
        { value: "seafood", label: "Hải sản" },
        { value: "meat", label: "Thịt" },
        { value: "dairy", label: "Sữa và sản phẩm từ sữa" },
        { value: "grains", label: "Ngũ cốc" },
        { value: "processed", label: "Thực phẩm chế biến" },
        { value: "other", label: "Khác" },
      ],
    },
    {
      key: "is_ftl",
      label: "Danh sách FTL",
      type: "select" as const,
      options: [
        { value: "true", label: "Có trong FTL" },
        { value: "false", label: "Không có trong FTL" },
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
    router.push(`/dashboard/products?${params.toString()}`)
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

    router.push(`/dashboard/products?${params.toString()}`)
  }

  return (
    <DataTableSearch
      searchPlaceholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
      filterConfigs={filterConfigs}
      onSearch={handleSearch}
      onFilter={handleFilter}
    />
  )
}
