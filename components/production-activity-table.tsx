"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react"

interface ProductionActivity {
  id: string
  lot_code: string
  product_name: string
  operator_name: string
  cte_status: "complete" | "error" | "processing"
  kde_status: "complete" | "error" | "processing"
  time_ago: string
}

const mockData: ProductionActivity[] = [
  {
    id: "1",
    lot_code: "LOT-2024-001",
    product_name: "Thịnh lượng rau đỏ",
    operator_name: "Nguyễn Văn A",
    cte_status: "complete",
    kde_status: "complete",
    time_ago: "10 phút trước",
  },
  {
    id: "2",
    lot_code: "LOT-2024-002",
    product_name: "Xoài cát Hòa Lộc",
    operator_name: "Trần Thị B",
    cte_status: "error",
    kde_status: "processing",
    time_ago: "25 phút trước",
  },
  {
    id: "3",
    lot_code: "LOT-2024-003",
    product_name: "Cau băng me",
    operator_name: "Lê Văn C",
    cte_status: "processing",
    kde_status: "complete",
    time_ago: "45 phút trước",
  },
]

export function ProductionActivityTable() {
  const getStatusBadge = (status: "complete" | "error" | "processing") => {
    const config = {
      complete: {
        icon: CheckCircle2,
        label: "Hoàn tất",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
      },
      error: {
        icon: AlertCircle,
        label: "Lỗi",
        className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
      },
      processing: {
        icon: Clock,
        label: "Đang xử lý",
        className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
      },
    }

    const { icon: Icon, label, className } = config[status]
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  return (
    <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-bold">Hoạt động sản xuất gần đây</CardTitle>
        <Button asChild variant="outline" size="sm" className="rounded-xl bg-transparent">
          <Link href="/dashboard/cte">
            Xem tất cả
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockData.map((activity) => (
            <div
              key={activity.id}
              className="p-4 rounded-2xl border bg-card hover:shadow-md transition-all duration-200 hover:border-emerald-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-foreground">{activity.lot_code}</span>
                    <Badge variant="secondary" className="text-xs">
                      {activity.product_name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="font-medium">Operator:</span> {activity.operator_name}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">CTE:</span>
                    {getStatusBadge(activity.cte_status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">KDE:</span>
                    {getStatusBadge(activity.kde_status)}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time_ago}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockData.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="font-medium text-foreground mb-1">Chưa có hoạt động nào</p>
            <p className="text-sm text-muted-foreground">Bắt đầu tạo lô hàng và theo dõi sản xuất</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
