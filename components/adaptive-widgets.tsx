"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, Thermometer, Truck, Factory } from "lucide-react"

interface AdaptiveWidgetsProps {
  organizationType: "initial_packer" | "distributor" | "retailer" | "processor"
  data: {
    tlcAssigned?: number
    coldStorageStatus?: string
    containerSchedule?: number
    sealCodes?: number
    processedBatches?: number
    inventoryLevel?: number
  }
}

export function AdaptiveWidgets({ organizationType, data }: AdaptiveWidgetsProps) {
  if (organizationType === "initial_packer") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Mã TLC đã gán</CardTitle>
              <Package className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.tlcAssigned || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Đã dán lên sản phẩm</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Trạng thái kho lạnh</CardTitle>
              <Thermometer className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={data.coldStorageStatus === "optimal" ? "default" : "destructive"}>
              {data.coldStorageStatus === "optimal" ? "Tối ưu" : "Cần kiểm tra"}
            </Badge>
            <p className="text-xs text-slate-500 mt-2">Nhiệt độ đang ổn định</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (organizationType === "distributor") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Lịch trình Container</CardTitle>
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.containerSchedule || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Chuyến hàng trong tuần</p>
            <Progress value={65} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Mã chì (Seal)</CardTitle>
              <Badge className="h-5 px-2 text-xs bg-orange-500">{data.sealCodes || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">Đã sử dụng hôm nay</p>
            <p className="text-xs text-slate-500 mt-1">Theo dõi toàn bộ seal codes</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (organizationType === "processor") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Lô đã chế biến</CardTitle>
              <Factory className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{data.processedBatches || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Tháng này</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Mức tồn kho</CardTitle>
              <Package className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={data.inventoryLevel || 0} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">{data.inventoryLevel || 0}% capacity</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
