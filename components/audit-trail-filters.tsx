"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DataTableSearch } from "@/components/data-table-search"

export function AuditTrailFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filterConfigs = [
    {
      key: "entity_type",
      label: "Loại đối tượng",
      type: "select" as const,
      options: [
        { value: "product", label: "Sản phẩm" },
        { value: "facility", label: "Cơ sở" },
        { value: "traceability_lot", label: "Lô hàng" },
        { value: "shipment", label: "Vận chuyển" },
        { value: "audit_report", label: "Báo cáo kiểm toán" },
        { value: "user", label: "Người dùng" },
        { value: "cte", label: "CTE" },
      ],
    },
    {
      key: "action",
      label: "Hành động",
      type: "select" as const,
      options: [
        { value: "create", label: "Tạo mới" },
        { value: "update", label: "Cập nhật" },
        { value: "delete", label: "Xóa" },
        { value: "view", label: "Xem" },
        { value: "export", label: "Xuất dữ liệu" },
        { value: "import", label: "Nhập dữ liệu" },
      ],
    },
    {
      key: "date",
      label: "Ngày",
      type: "daterange" as const,
    },
  ]

  const handleSearch = (query: string) => {
    // Not used for audit trail
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

    router.push(`/dashboard/audit-trail?${params.toString()}`)
  }

  return (
    <DataTableSearch
      searchPlaceholder="Tìm kiếm không khả dụng"
      filterConfigs={filterConfigs}
      onSearch={handleSearch}
      onFilter={handleFilter}
      showAdvancedFilters={true}
    />
  )
}
