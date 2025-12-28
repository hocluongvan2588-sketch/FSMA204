"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface InventoryStockWidgetProps {
  currentStock: number
  initialStock: number
  totalShipped: number
  totalTransformed: number
  unit?: string
  productName?: string
  className?: string
}

export function InventoryStockWidgetEnhanced({
  currentStock,
  initialStock,
  totalShipped,
  totalTransformed,
  unit = "kg",
  productName,
  className,
}: InventoryStockWidgetProps) {
  const utilizationPercent = initialStock > 0 ? ((initialStock - currentStock) / initialStock) * 100 : 0

  const getStockStatus = () => {
    if (currentStock <= 0)
      return {
        label: "Hết hàng",
        color: "destructive",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        icon: AlertTriangle,
      }
    if (currentStock < initialStock * 0.1)
      return {
        label: "Rất thấp",
        color: "destructive",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertTriangle,
      }
    if (currentStock < initialStock * 0.3)
      return {
        label: "Thấp",
        color: "secondary",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: TrendingDown,
      }
    return {
      label: "Tốt",
      color: "default",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle2,
    }
  }

  const status = getStockStatus()
  const StatusIcon = status.icon

  return (
    <Card className={`${className} ${status.borderColor} border-2`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Tồn kho khả dụng
          </span>
          <Badge variant={status.color as any}>{status.label}</Badge>
        </CardTitle>
        {productName && <CardDescription className="text-sm font-medium">{productName}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${status.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 mb-1">Số lượng hiện tại</p>
              <p className="text-3xl font-bold text-slate-900">
                {currentStock.toFixed(2)} <span className="text-lg">{unit}</span>
              </p>
            </div>
            <StatusIcon
              className={`h-8 w-8 ${
                status.color === "destructive"
                  ? "text-red-600"
                  : status.color === "secondary"
                    ? "text-amber-600"
                    : "text-green-600"
              }`}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Mức sử dụng</span>
            <span className="font-semibold">{utilizationPercent.toFixed(1)}%</span>
          </div>
          <Progress
            value={utilizationPercent}
            className={`h-2 ${
              utilizationPercent > 90 ? "bg-red-200" : utilizationPercent > 70 ? "bg-amber-200" : "bg-green-200"
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <p className="text-xs text-slate-500">Tồn đầu</p>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              {initialStock.toFixed(2)} {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Còn lại</p>
            <p className="text-sm font-semibold text-slate-900">
              {currentStock.toFixed(2)} {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Đã xuất</p>
            <p className="text-sm font-semibold text-orange-700 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {totalShipped.toFixed(2)} {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Đã chế biến</p>
            <p className="text-sm font-semibold text-purple-700 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {totalTransformed.toFixed(2)} {unit}
            </p>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-xs text-blue-800">
            <strong>Công thức:</strong> Tồn kho = Tồn đầu + Tiếp nhận - Xuất kho - Chế biến
          </AlertDescription>
        </Alert>

        {currentStock <= 0 && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Cảnh báo:</strong> Không thể tạo sự kiện xuất kho, làm lạnh, hoặc đóng gói khi hết hàng.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
