"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, FileWarning } from "lucide-react"
import { checkComplianceStatus, type ComplianceStatus } from "@/lib/utils/compliance-checker"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ComplianceDashboardProps {
  companyId: string
}

export function ComplianceDashboard({ companyId }: ComplianceDashboardProps) {
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const data = await checkComplianceStatus(companyId)
        setCompliance(data)
      } catch (error) {
        console.error("[v0] Failed to fetch compliance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompliance()
  }, [companyId])

  if (loading || !compliance) {
    return (
      <Card data-tour="compliance-status">
        <CardHeader>
          <CardTitle>Trạng thái tuân thủ FSMA 204</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Tốt"
    if (score >= 70) return "Cần cải thiện"
    return "Không đạt"
  }

  return (
    <div data-tour="compliance-status" className="space-y-4">
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Trạng thái tuân thủ FSMA 204</CardTitle>
            {compliance.overall_score >= 90 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(compliance.overall_score)}`}>
                {compliance.overall_score}%
              </div>
              <div className="text-sm text-slate-500">{getScoreLabel(compliance.overall_score)}</div>
            </div>
            <Badge variant={compliance.overall_score >= 90 ? "default" : "destructive"}>
              {compliance.compliant_ctes}/{compliance.total_ctes} đạt chuẩn
            </Badge>
          </div>

          <Progress value={compliance.overall_score} className="h-2" />

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <div className="text-xs text-slate-500">Tuân thủ</div>
              <div className="text-lg font-semibold text-green-600">{compliance.compliant_ctes}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Vi phạm</div>
              <div className="text-lg font-semibold text-red-600">{compliance.non_compliant_ctes}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {compliance.non_compliant_ctes > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileWarning className="h-4 w-4" />
              KDE còn thiếu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(compliance.missing_kdes_summary)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([kde, count]) => (
                  <div key={kde} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 capitalize">{kde.replace(/_/g, " ")}</span>
                    <Badge variant="outline" className="text-xs">
                      {count} lần
                    </Badge>
                  </div>
                ))}
            </div>
            <Button asChild size="sm" variant="outline" className="w-full mt-4 bg-transparent">
              <Link href="/dashboard/data-quality">Xem chi tiết</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
