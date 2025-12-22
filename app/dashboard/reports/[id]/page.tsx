import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: report, error } = await supabase
    .from("audit_reports")
    .select("*, facilities(name, location_code)")
    .eq("id", id)
    .single()

  if (error || !report) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{report.report_number}</h1>
          <p className="text-slate-500 mt-1">Báo cáo kiểm toán</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin kiểm toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Số báo cáo</p>
              <p className="text-base font-medium mt-1">{report.report_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Loại báo cáo</p>
              <p className="text-base font-medium mt-1 capitalize">
                {report.report_type === "internal"
                  ? "Kiểm toán nội bộ"
                  : report.report_type === "external"
                    ? "Kiểm toán bên ngoài"
                    : report.report_type === "regulatory"
                      ? "Kiểm toán cơ quan quản lý"
                      : "Kiểm tra tuân thủ"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngày kiểm toán</p>
              <p className="text-base font-medium mt-1">{new Date(report.audit_date).toLocaleDateString("vi-VN")}</p>
            </div>
            {report.facilities && (
              <div>
                <p className="text-sm text-slate-500">Cơ sở</p>
                <p className="text-base font-medium mt-1">
                  {report.facilities.name} ({report.facilities.location_code})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kiểm toán viên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Tên</p>
              <p className="text-base font-medium mt-1">{report.auditor_name}</p>
            </div>
            {report.auditor_organization && (
              <div>
                <p className="text-sm text-slate-500">Tổ chức</p>
                <p className="text-base font-medium mt-1">{report.auditor_organization}</p>
              </div>
            )}
            {report.follow_up_date && (
              <div>
                <p className="text-sm text-slate-500">Ngày theo dõi</p>
                <p className="text-base font-medium mt-1">
                  {new Date(report.follow_up_date).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {report.findings && (
        <Card>
          <CardHeader>
            <CardTitle>Phát hiện</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-slate-700 whitespace-pre-wrap">{report.findings}</p>
          </CardContent>
        </Card>
      )}

      {report.corrective_actions && (
        <Card>
          <CardHeader>
            <CardTitle>Hành động khắc phục</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-slate-700 whitespace-pre-wrap">{report.corrective_actions}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/reports">Quay lại danh sách</Link>
        </Button>
      </div>
    </div>
  )
}
