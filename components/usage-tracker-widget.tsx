"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Users, Building2, Package, HardDrive, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface UsageData {
  users: { current: number; limit: number; percentage: number }
  facilities: { current: number; limit: number; percentage: number }
  products: { current: number; limit: number; percentage: number }
  storage: { current: number; limit: number; percentage: number; unit: string }
  packageName: string
  isUnlimited: boolean
}

interface UsageTrackerWidgetProps {
  usage: UsageData
  showUpgradePrompt?: boolean
}

export function UsageTrackerWidget({ usage, showUpgradePrompt = true }: UsageTrackerWidgetProps) {
  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: "text-red-600", bgColor: "bg-red-100", label: "Gần đạt giới hạn" }
    if (percentage >= 75) return { color: "text-orange-600", bgColor: "bg-orange-100", label: "Cảnh báo" }
    return { color: "text-emerald-600", bgColor: "bg-emerald-100", label: "Bình thường" }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "[&>div]:bg-red-500"
    if (percentage >= 75) return "[&>div]:bg-orange-500"
    return "[&>div]:bg-emerald-500"
  }

  const metrics = [
    {
      icon: Users,
      label: "Người dùng",
      ...usage.users,
      description: "Số lượng tài khoản trong hệ thống",
    },
    {
      icon: Building2,
      label: "Cơ sở",
      ...usage.facilities,
      description: "Cơ sở sản xuất/kho bãi",
    },
    {
      icon: Package,
      label: "Sản phẩm",
      ...usage.products,
      description: "Sản phẩm đã đăng ký",
    },
    {
      icon: HardDrive,
      label: "Lưu trữ",
      ...usage.storage,
      description: "Dung lượng lưu trữ file",
    },
  ]

  const hasWarnings = metrics.some((m) => m.percentage >= 75)

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Sử dụng gói dịch vụ</CardTitle>
            <CardDescription className="text-sm text-slate-600 mt-1">
              Theo dõi mức sử dụng so với giới hạn
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {usage.packageName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasWarnings && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">Sắp đạt giới hạn</p>
              <p className="text-xs text-orange-700 mt-1">
                Bạn đang sử dụng gần hết quota. Hãy nâng cấp để tiếp tục sử dụng.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const status = getUsageStatus(metric.percentage)
            const isAtLimit = metric.current >= metric.limit && !usage.isUnlimited

            return (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${status.bgColor}`}>
                      <Icon className={`h-4 w-4 ${status.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{metric.label}</p>
                      <p className="text-xs text-slate-500">{metric.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {metric.current}
                      {metric.unit && ` ${metric.unit}`} / {usage.isUnlimited ? "∞" : metric.limit}
                      {metric.unit && !usage.isUnlimited && ` ${metric.unit}`}
                    </p>
                    {!usage.isUnlimited && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${isAtLimit ? "bg-red-50 text-red-700 border-red-200" : status.bgColor + " " + status.color + " border-current"}`}
                      >
                        {isAtLimit ? "Đã đầy" : `${metric.percentage.toFixed(0)}%`}
                      </Badge>
                    )}
                  </div>
                </div>
                {!usage.isUnlimited && (
                  <Progress
                    value={Math.min(metric.percentage, 100)}
                    className={`h-2 ${getProgressColor(metric.percentage)}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {showUpgradePrompt && !usage.isUnlimited && hasWarnings && (
          <div className="pt-4 border-t border-slate-200">
            <Button asChild variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Link href="/admin/pricing">
                <TrendingUp className="h-4 w-4" />
                Nâng cấp để tăng giới hạn
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
