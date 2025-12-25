import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, User, Clock, FileEdit } from "lucide-react"

export default async function AuditDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: auditLog, error } = await supabase.from("audit_logs").select("*").eq("id", id).single()

  if (error || !auditLog) {
    notFound()
  }

  // Parse JSON data for better display
  const oldData = auditLog.old_data as Record<string, any> | null
  const newData = auditLog.new_data as Record<string, any> | null
  const changedFields = auditLog.changed_fields as string[] | null

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/audit">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chi tiết thay đổi</h1>
          <p className="text-slate-500 mt-1">Xem chi tiết các thay đổi dữ liệu</p>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tổng quan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Loại thao tác</p>
                <Badge
                  variant={
                    auditLog.operation === "INSERT"
                      ? "default"
                      : auditLog.operation === "UPDATE"
                        ? "secondary"
                        : auditLog.operation === "DELETE"
                          ? "destructive"
                          : "outline"
                  }
                  className="mt-1"
                >
                  {auditLog.operation}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">Bảng dữ liệu</p>
              <p className="text-base font-medium font-mono mt-1">{auditLog.table_name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">ID bản ghi</p>
              <p className="text-base font-mono mt-1 text-slate-600">{auditLog.record_id}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Người thực hiện</p>
                <p className="text-base font-medium mt-1">{auditLog.user_email}</p>
                {auditLog.user_role && (
                  <Badge variant="outline" className="mt-1">
                    {auditLog.user_role}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Thời gian</p>
                <p className="text-base font-medium mt-1">
                  {new Date(auditLog.created_at).toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {auditLog.is_fsma_critical && (
              <div>
                <Badge variant="destructive" className="mt-2">
                  FSMA Critical - Quan trọng với FDA
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Reason */}
      {auditLog.compliance_reason && (
        <Card>
          <CardHeader>
            <CardTitle>Lý do thay đổi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{auditLog.compliance_reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Changed Fields */}
      {changedFields && changedFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Các trường thay đổi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {changedFields.map((field) => (
                <Badge key={field} variant="secondary">
                  {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {oldData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Dữ liệu cũ</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(oldData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {newData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Dữ liệu mới</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(newData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {auditLog.ip_address && (
            <div>
              <p className="text-sm text-slate-500">IP Address</p>
              <p className="text-base font-mono mt-1">{auditLog.ip_address}</p>
            </div>
          )}
          {auditLog.user_agent && (
            <div>
              <p className="text-sm text-slate-500">User Agent</p>
              <p className="text-sm font-mono mt-1 text-slate-600 break-all">{auditLog.user_agent}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/audit">Quay lại danh sách</Link>
        </Button>
      </div>
    </div>
  )
}
