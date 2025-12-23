import { getAuditTrail } from "@/lib/utils/audit-trail"
import { getActionLabel, getEntityTypeLabel } from "@/lib/utils/activity-logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuditTrailFilters } from "@/components/audit-trail-filters"
import { Clock, User, FileText } from "lucide-react"
import Link from "next/link"

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: {
    entity_type?: string
    action?: string
    date_from?: string
    date_to?: string
  }
}) {
  const auditTrail = await getAuditTrail({
    entityType: searchParams.entity_type,
    action: searchParams.action,
    dateFrom: searchParams.date_from,
    dateTo: searchParams.date_to,
  })

  const actionCounts = auditTrail.reduce(
    (acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const uniqueUsers = new Set(auditTrail.map((e) => e.userId)).size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nhật ký hoạt động</h1>
          <p className="text-slate-500 mt-1">Theo dõi mọi thay đổi trong hệ thống</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/api/audit-trail/export">Xuất CSV</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Tổng hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditTrail.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Người dùng hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Tạo mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{actionCounts.create || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Cập nhật</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{actionCounts.update || 0}</div>
          </CardContent>
        </Card>
      </div>

      <AuditTrailFilters />

      {auditTrail.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có hoạt động nào</h3>
            <p className="text-slate-500">Nhật ký hoạt động sẽ được hiển thị tại đây</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          entry.action === "create"
                            ? "default"
                            : entry.action === "delete"
                              ? "destructive"
                              : entry.action === "update"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {getActionLabel(entry.action as any)}
                      </Badge>
                      <Badge variant="outline">{getEntityTypeLabel(entry.entityType as any)}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {entry.userRole}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium text-slate-900 mb-1">{entry.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{entry.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(entry.timestamp).toLocaleString("vi-VN")}</span>
                      </div>
                      {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                    </div>

                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                          Chi tiết metadata
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {entry.entityId && (
                    <Button asChild size="sm" variant="outline" className="shrink-0 bg-white">
                      <Link
                        href={`/dashboard/${entry.entityType === "traceability_lot" ? "lots" : entry.entityType === "audit_report" ? "reports" : entry.entityType === "fda_registration" ? "fda" : entry.entityType}s/${entry.entityId}`}
                      >
                        Xem
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
