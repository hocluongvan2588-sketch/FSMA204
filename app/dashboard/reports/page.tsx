import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ReportsSearchFilter } from "@/components/reports-search-filter"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: {
    search?: string
    compliance_status?: string
    report_type?: string
    audit_date_from?: string
    audit_date_to?: string
  }
}) {
  const supabase = await createClient()
  const { search, compliance_status, report_type, audit_date_from, audit_date_to } = searchParams

  let query = supabase.from("audit_reports").select("*, facilities(name)")

  if (search) {
    query = query.or(`report_number.ilike.%${search}%,auditor_name.ilike.%${search}%`)
  }

  if (compliance_status) {
    query = query.eq("compliance_status", compliance_status)
  }

  if (report_type) {
    query = query.eq("report_type", report_type)
  }

  if (audit_date_from) {
    query = query.gte("audit_date", audit_date_from)
  }

  if (audit_date_to) {
    query = query.lte("audit_date", audit_date_to)
  }

  const { data: reports } = await query.order("audit_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Báo cáo & Kiểm toán</h1>
          <p className="text-slate-500 mt-1">Quản lý báo cáo tuân thủ FSMA 204</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/dashboard/reports/generate">Tạo báo cáo</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/reports/create">Thêm kiểm toán</Link>
          </Button>
        </div>
      </div>

      <ReportsSearchFilter />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Tổng báo cáo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Tuân thủ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports?.filter((r) => r.compliance_status === "compliant").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Không tuân thủ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reports?.filter((r) => r.compliance_status === "non_compliant").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Cần hành động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reports?.filter((r) => r.compliance_status === "requires_action").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có báo cáo nào</h3>
            <p className="text-slate-500 mb-6">Tạo báo cáo kiểm toán đầu tiên</p>
            <Button asChild>
              <Link href="/dashboard/reports/create">Tạo báo cáo mới</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-slate-900">{report.report_number}</h3>
                      <Badge
                        variant={
                          report.compliance_status === "compliant"
                            ? "default"
                            : report.compliance_status === "non_compliant"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {report.compliance_status === "compliant"
                          ? "Tuân thủ"
                          : report.compliance_status === "non_compliant"
                            ? "Không tuân thủ"
                            : "Cần hành động"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {report.report_type === "internal"
                          ? "Nội bộ"
                          : report.report_type === "external"
                            ? "Bên ngoài"
                            : report.report_type === "regulatory"
                              ? "Cơ quan quản lý"
                              : "Tuân thủ"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-slate-500">Ngày kiểm toán</p>
                        <p className="font-medium">{new Date(report.audit_date).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Kiểm toán viên</p>
                        <p className="font-medium truncate">{report.auditor_name}</p>
                      </div>
                      {report.auditor_organization && (
                        <div>
                          <p className="text-slate-500">Tổ chức</p>
                          <p className="font-medium truncate">{report.auditor_organization}</p>
                        </div>
                      )}
                      {report.facilities && (
                        <div>
                          <p className="text-slate-500">Cơ sở</p>
                          <p className="font-medium truncate">{report.facilities.name}</p>
                        </div>
                      )}
                    </div>

                    {report.findings && (
                      <div className="text-sm">
                        <p className="text-slate-500">Phát hiện</p>
                        <p className="text-slate-700 line-clamp-2">{report.findings}</p>
                      </div>
                    )}
                  </div>

                  <Button asChild size="sm" variant="outline" className="shrink-0 bg-transparent">
                    <Link href={`/dashboard/reports/${report.id}`}>Chi tiết</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
