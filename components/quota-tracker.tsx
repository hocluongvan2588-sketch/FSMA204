"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"
import { getQuotaInfo, type QuotaInfo } from "@/lib/utils/quota-tracker"
import { Badge } from "@/components/ui/badge"

interface QuotaTrackerProps {
  companyId: string
}

export function QuotaTracker({ companyId }: QuotaTrackerProps) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const data = await getQuotaInfo(companyId)
        setQuota(data)
      } catch (error) {
        console.error("[v0] Failed to fetch quota:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuota()
    // Refresh every 5 minutes
    const interval = setInterval(fetchQuota, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [companyId])

  if (loading || !quota) {
    return (
      <Card data-tour="quota-tracker">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hạn mức tháng này</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <div className="animate-pulse h-2 w-full bg-slate-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getIcon = () => {
    switch (quota.warningLevel) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
  }

  const getColor = () => {
    switch (quota.warningLevel) {
      case "critical":
        return "bg-red-600"
      case "warning":
        return "bg-amber-600"
      default:
        return "bg-blue-600"
    }
  }

  const getMessage = () => {
    switch (quota.warningLevel) {
      case "critical":
        return "Sắp hết hạn mức! Hãy nâng cấp gói dịch vụ."
      case "warning":
        return "Hạn mức sắp đầy. Cân nhắc nâng cấp."
      default:
        return "Hạn mức đang ổn định"
    }
  }

  return (
    <Card data-tour="quota-tracker" className="border-l-4" style={{ borderLeftColor: getColor().replace("bg-", "") }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Hạn mức tháng này</CardTitle>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold">{quota.used}</div>
            <div className="text-xs text-slate-500">/ {quota.limit} sự kiện</div>
          </div>
          <Badge
            variant={
              quota.warningLevel === "critical"
                ? "destructive"
                : quota.warningLevel === "warning"
                  ? "default"
                  : "secondary"
            }
          >
            {quota.percentage}%
          </Badge>
        </div>

        <Progress value={quota.percentage} className="h-2" />

        <p className="text-xs text-slate-600">{getMessage()}</p>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
          <span>Còn lại: {quota.remaining} sự kiện</span>
          <span>Làm mới hàng tháng</span>
        </div>
      </CardContent>
    </Card>
  )
}
