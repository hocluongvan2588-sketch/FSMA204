"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Clock, CheckCircle2, Calendar, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ExpirationItem {
  tlc: string
  product_name: string
  lot_number: string
  expiry_date: string
  days_until_expiry: number
  current_stock: number
  expiry_status: "expired" | "critical" | "warning" | "safe"
}

export function ExpirationMonitorWidget() {
  const [expirationData, setExpirationData] = useState<ExpirationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    expired: 0,
    critical: 0,
    warning: 0,
    safe: 0,
  })

  useEffect(() => {
    loadExpirationData()
  }, [])

  const loadExpirationData = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("expiration_monitoring")
        .select("*")
        .order("days_until_expiry", { ascending: true })
        .limit(20)

      if (error) throw error

      setExpirationData(data || [])

      // Calculate summary
      if (data) {
        setSummary({
          expired: data.filter((item) => item.expiry_status === "expired").length,
          critical: data.filter((item) => item.expiry_status === "critical").length,
          warning: data.filter((item) => item.expiry_status === "warning").length,
          safe: data.filter((item) => item.expiry_status === "safe").length,
        })
      }
    } catch (err) {
      console.error("[v0] Expiration data load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "critical":
        return <Badge className="bg-orange-600 text-white">Critical</Badge>
      case "warning":
        return <Badge className="bg-yellow-600 text-white">Warning</Badge>
      default:
        return <Badge className="bg-green-600 text-white">Safe</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const urgentItems = expirationData.filter(
    (item) => item.expiry_status === "expired" || item.expiry_status === "critical",
  )

  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50/50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-600" />
            <CardTitle>Expiration Monitor</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Theo dõi shelf life của products. FDA yêu cầu ghi nhận expiration date cho tất cả FTL products (FSMA
                  204 Section 204.4).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Real-time monitoring của lot expiration dates (FDA compliance)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Status Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-red-100 rounded-lg p-2 text-center border border-red-200">
            <p className="text-2xl font-bold text-red-600">{summary.expired}</p>
            <p className="text-xs text-red-700">Expired</p>
          </div>
          <div className="bg-orange-100 rounded-lg p-2 text-center border border-orange-200">
            <p className="text-2xl font-bold text-orange-600">{summary.critical}</p>
            <p className="text-xs text-orange-700">Critical</p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-2 text-center border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">{summary.warning}</p>
            <p className="text-xs text-yellow-700">Warning</p>
          </div>
          <div className="bg-green-100 rounded-lg p-2 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-600">{summary.safe}</p>
            <p className="text-xs text-green-700">Safe</p>
          </div>
        </div>

        {/* Urgent Items Alert */}
        {urgentItems.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">{urgentItems.length} lot(s) cần action ngay!</p>
                <p className="text-xs text-red-700 mt-0.5">
                  FDA yêu cầu không phân phối products đã expired. Review và dispose theo quy định.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expiration List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {expirationData.slice(0, 10).map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2 rounded-lg border ${
                item.expiry_status === "expired"
                  ? "bg-red-50 border-red-200"
                  : item.expiry_status === "critical"
                    ? "bg-orange-50 border-orange-200"
                    : item.expiry_status === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-white border-gray-200"
              }`}
            >
              {getStatusIcon(item.expiry_status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  TLC: {item.tlc} • Lot: {item.lot_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(item.expiry_date).toLocaleDateString()}(
                  {item.days_until_expiry > 0
                    ? `${item.days_until_expiry} days left`
                    : `${Math.abs(item.days_until_expiry)} days ago`}
                  )
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(item.expiry_status)}
                <p className="text-xs text-muted-foreground mt-1">Stock: {item.current_stock} kg</p>
              </div>
            </div>
          ))}
        </div>

        {expirationData.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tất cả lots đều an toàn! Không có items sắp hết hạn.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
