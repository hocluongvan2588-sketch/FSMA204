"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, TrendingUp, TrendingDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ComplianceScore {
  compliance_percentage: number
  organization_type: string
  total_ctes: number
  compliant_ctes: number
  non_compliant_ctes?: number
  score_breakdown?: any
  total_alerts?: number
  critical_alerts?: number
  high_alerts?: number
  medium_alerts?: number
  low_alerts?: number
  missing_kde_count?: number
  timeline_violations?: number
  quantity_mismatches?: number
  deduction_reasons?: Array<{
    reason: string
    count: number
    type: string
  }>
}

interface RealtimeComplianceWidgetProps {
  companyId?: string
  initialScore?: ComplianceScore
  refreshInterval?: number
}

export function RealtimeComplianceWidget({
  companyId,
  initialScore,
  refreshInterval = 30000,
}: RealtimeComplianceWidgetProps) {
  const [score, setScore] = useState<ComplianceScore | null>(initialScore || null)
  const [loading, setLoading] = useState(!initialScore)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable")
  const [previousScore, setPreviousScore] = useState<number>(0)
  const [showNonCompliantList, setShowNonCompliantList] = useState(false)
  const [nonCompliantCTEs, setNonCompliantCTEs] = useState<any[]>([])

  const supabase = createClient()

  const fetchComplianceScore = async () => {
    try {
      if (!companyId) return

      const { data, error } = await supabase.rpc("calculate_realtime_compliance_score", {
        company_id_param: companyId,
      })

      if (error) {
        console.error("[v0] Failed to fetch compliance score:", error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const newScore = data[0]

        if (score) {
          const diff = newScore.compliance_percentage - (score.compliance_percentage || 0)
          if (Math.abs(diff) < 1) {
            setTrend("stable")
          } else if (diff > 0) {
            setTrend("up")
          } else {
            setTrend("down")
          }
          setPreviousScore(score.compliance_percentage || 0)
        }

        setScore(newScore)
        setLastUpdate(new Date())
      }
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching compliance score:", error)
      setLoading(false)
    }
  }

  const fetchNonCompliantCTEs = async () => {
    try {
      const { data, error } = await supabase
        .from("critical_tracking_events")
        .select(`
          *,
          traceability_lots(tlc, products(product_name)),
          facilities(name),
          data_quality_alerts!inner(status, alert_type)
        `)
        .eq("data_quality_alerts.status", "open")
        .eq("data_quality_alerts.alert_type", "missing_kde")
        .limit(10)

      if (error) {
        console.error("[v0] Failed to fetch non-compliant CTEs:", error)
        return
      }

      setNonCompliantCTEs(data || [])
    } catch (error) {
      console.error("[v0] Error fetching non-compliant CTEs:", error)
    }
  }

  useEffect(() => {
    if (!initialScore && companyId) {
      fetchComplianceScore()
      const interval = setInterval(fetchComplianceScore, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [companyId, refreshInterval, initialScore])

  if (loading || !score) {
    return (
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Điểm Tuân Thủ FSMA 204</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-24 bg-slate-200 rounded-2xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = () => {
    if (score.compliance_percentage >= 90) return "text-emerald-600"
    if (score.compliance_percentage >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreGradient = () => {
    if (score.compliance_percentage >= 90) return "from-emerald-500 to-emerald-600"
    if (score.compliance_percentage >= 70) return "from-amber-500 to-amber-600"
    return "from-red-500 to-red-600"
  }

  const getScoreLabel = () => {
    if (score.compliance_percentage >= 90) return "Xuất sắc"
    if (score.compliance_percentage >= 70) return "Tốt"
    if (score.compliance_percentage >= 50) return "Trung bình"
    return "Cần cải thiện"
  }

  return (
    <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle2 className="shrink-0 h-5 w-5 text-emerald-600" />
            Điểm Tuân Thủ FSMA 204
          </CardTitle>
          <Badge variant="outline" className="text-xs shrink-0">
            Realtime
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Cập nhật lần cuối: {lastUpdate.toLocaleTimeString("vi-VN")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getScoreColor()}`}>
                {score.compliance_percentage != null ? score.compliance_percentage.toFixed(1) : "0.0"}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">{getScoreLabel()}</p>
          </div>

          {/* Trend Indicator */}
          <div
            className={`shrink-0 flex flex-col items-center p-3 rounded-2xl ${
              trend === "up"
                ? "bg-emerald-50 dark:bg-emerald-950"
                : trend === "down"
                  ? "bg-red-50 dark:bg-red-950"
                  : "bg-slate-50 dark:bg-slate-900"
            }`}
          >
            {trend === "up" && <TrendingUp className="h-6 w-6 text-emerald-600" />}
            {trend === "down" && <TrendingDown className="h-6 w-6 text-red-600" />}
            {trend === "stable" && <span className="text-xl font-bold text-slate-600">−</span>}
            <span className="text-xs text-muted-foreground mt-1">
              {trend === "up" ? "Tăng" : trend === "down" ? "Giảm" : "Ổn định"}
            </span>
          </div>
        </div>

        <Progress value={score.compliance_percentage ?? 0} className={`h-3 bg-gradient-to-r ${getScoreGradient()}`} />

        {/* Deduction Reasons Section */}
        {score.deduction_reasons && score.deduction_reasons.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Lý do chính gây mất điểm
            </p>
            <div className="space-y-2">
              {score.deduction_reasons.map((deduction, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">{deduction.reason}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Ảnh hưởng: {deduction.count} bản ghi
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {deduction.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild size="sm" className="w-full rounded-xl bg-red-600 hover:bg-red-700">
              <Link href="/dashboard/alerts?type=missing_kde">Xem chi tiết và sửa lỗi</Link>
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-center">
            <p className="text-2xl font-bold text-emerald-600">{score.compliant_ctes}</p>
            <p className="text-xs text-muted-foreground mt-1">CTE Đạt chuẩn</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{score.total_ctes}</p>
            <p className="text-xs text-muted-foreground mt-1">Tổng CTE</p>
          </div>
        </div>

        {score.non_compliant_ctes && score.non_compliant_ctes > 0 && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {score.non_compliant_ctes} CTE thiếu KDE bắt buộc
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNonCompliantList(!showNonCompliantList)
                    if (!showNonCompliantList && nonCompliantCTEs.length === 0) {
                      fetchNonCompliantCTEs()
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  {showNonCompliantList ? "Ẩn chi tiết" : "Xem chi tiết"}
                </Button>
              </div>
            </div>

            {showNonCompliantList && (
              <div className="space-y-2 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900">
                <p className="text-xs font-semibold text-muted-foreground mb-2">CTE cần xử lý gấp:</p>
                {nonCompliantCTEs.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {nonCompliantCTEs.map((cte) => (
                      <div
                        key={cte.id}
                        className="p-3 rounded-lg bg-white dark:bg-slate-800 border hover:border-red-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {cte.traceability_lots?.products?.product_name || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">TLC: {cte.traceability_lots?.tlc}</p>
                            <p className="text-xs text-muted-foreground">Cơ sở: {cte.facilities?.name}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs shrink-0 bg-transparent"
                            onClick={() => {
                              window.location.href = `/dashboard/cte/${cte.id}`
                            }}
                          >
                            Sửa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button asChild size="sm" variant="outline" className="w-full text-xs bg-transparent">
                  <Link href="/dashboard/cte?filter=non_compliant">Xem tất cả CTE thiếu KDE</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Alerts Breakdown */}
        {score.total_alerts && score.total_alerts > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-semibold text-foreground">Cảnh báo hiện tại</p>
            <div className="grid grid-cols-2 gap-3">
              {score.critical_alerts && score.critical_alerts > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950">
                  <AlertCircle className="shrink-0 h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-bold text-red-600">{score.critical_alerts}</p>
                    <p className="text-xs text-muted-foreground">Nghiêm trọng</p>
                  </div>
                </div>
              )}
              {score.high_alerts && score.high_alerts > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950">
                  <AlertTriangle className="shrink-0 h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-bold text-orange-600">{score.high_alerts}</p>
                    <p className="text-xs text-muted-foreground">Cao</p>
                  </div>
                </div>
              )}
              {score.medium_alerts && score.medium_alerts > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950">
                  <Info className="shrink-0 h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-600">{score.medium_alerts}</p>
                    <p className="text-xs text-muted-foreground">Trung bình</p>
                  </div>
                </div>
              )}
            </div>

            <Button asChild size="sm" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700">
              <Link href="/dashboard/alerts">Xem tất cả cảnh báo ({score.total_alerts})</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RealtimeComplianceWidget
