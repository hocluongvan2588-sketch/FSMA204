import { runDataQualityChecks } from "@/lib/utils/data-quality"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import Link from "next/link"

export default async function DataQualityPage() {
  const report = await runDataQualityChecks()

  const severityConfig = {
    critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    high: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    medium: { icon: Info, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    low: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chất lượng dữ liệu</h1>
          <p className="text-slate-500 mt-1">Kiểm tra và cải thiện chất lượng dữ liệu hệ thống</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/data-quality/fix">Sửa tự động</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Điểm chất lượng</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${report.score >= 90 ? "text-green-600" : report.score >= 70 ? "text-yellow-600" : "text-red-600"}`}
            >
              {report.score}/100
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {report.score >= 90 ? "Xuất sắc" : report.score >= 70 ? "Tốt" : "Cần cải thiện"}
            </p>
          </CardContent>
        </Card>

        <Card className={report.criticalIssues > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Vấn đề nghiêm trọng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{report.criticalIssues}</div>
          </CardContent>
        </Card>

        <Card className={report.highIssues > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Vấn đề cao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{report.highIssues}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Tổng vấn đề</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700">{report.totalIssues}</div>
          </CardContent>
        </Card>
      </div>

      {report.issues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Dữ liệu chất lượng cao</h3>
            <p className="text-slate-500">Không phát hiện vấn đề nào trong hệ thống</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách vấn đề</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.issues.map((issue, index) => {
                const config = severityConfig[issue.severity]
                const Icon = config.icon

                return (
                  <div key={index} className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${config.color} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">
                            {issue.severity === "critical"
                              ? "Nghiêm trọng"
                              : issue.severity === "high"
                                ? "Cao"
                                : issue.severity === "medium"
                                  ? "Trung bình"
                                  : "Thấp"}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {issue.type === "missing_data"
                              ? "Thiếu dữ liệu"
                              : issue.type === "duplicate"
                                ? "Trùng lặp"
                                : issue.type === "invalid_format"
                                  ? "Định dạng sai"
                                  : issue.type === "inconsistent"
                                    ? "Không nhất quán"
                                    : "Lỗi thời"}
                          </Badge>
                        </div>
                        <p className={`font-medium ${config.color} mb-1`}>{issue.message}</p>
                        {issue.suggestion && <p className="text-sm text-slate-600">{issue.suggestion}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>Entity: {issue.entity}</span>
                          <span>Field: {issue.field}</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="shrink-0 bg-white">
                        <Link
                          href={`/dashboard/${issue.entity === "traceability_lot" ? "lots" : issue.entity === "product" ? "products" : issue.entity === "facility" ? "facilities" : "shipments"}/${issue.entityId}`}
                        >
                          Sửa
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
