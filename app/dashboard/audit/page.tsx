import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Shield, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { table?: string; operation?: string; search?: string }
}) {
  const supabase = await createClient()

  // Get audit stats
  const { data: stats } = await supabase.rpc("get_audit_stats", { p_days: 30 }).single()

  // Get recent audit logs with filters
  const { data: auditLogs } = await supabase.rpc("search_audit_logs", {
    p_table_name: searchParams.table || null,
    p_operation: searchParams.operation || null,
    p_search_term: searchParams.search || null,
    p_limit: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nhật ký kiểm toán</h1>
          <p className="text-slate-500 mt-1">Theo dõi mọi thay đổi dữ liệu quan trọng trong hệ thống</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/audit/report">
            <TrendingUp className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng thay đổi</CardTitle>
            <History className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_changes || 0}</div>
            <p className="text-xs text-slate-500 mt-1">30 ngày qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sự kiện CTE</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cte_changes || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Thay đổi CTE</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lô hàng TLC</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tlc_changes || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Thay đổi TLC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">FSMA Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.critical_changes || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Thay đổi quan trọng</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <Input name="search" placeholder="Tìm kiếm..." defaultValue={searchParams.search} />
            <Select name="table" defaultValue={searchParams.table}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả bảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả bảng</SelectItem>
                <SelectItem value="critical_tracking_events">CTE Events</SelectItem>
                <SelectItem value="traceability_lots">TLC Lots</SelectItem>
                <SelectItem value="key_data_elements">KDE</SelectItem>
                <SelectItem value="facilities">Facilities</SelectItem>
                <SelectItem value="products">Products</SelectItem>
              </SelectContent>
            </Select>
            <Select name="operation" defaultValue={searchParams.operation}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả thao tác" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="INSERT">Tạo mới</SelectItem>
                <SelectItem value="UPDATE">Cập nhật</SelectItem>
                <SelectItem value="DELETE">Xóa</SelectItem>
                <SelectItem value="RESTORE">Khôi phục</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Lọc</Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thay đổi</CardTitle>
        </CardHeader>
        <CardContent>
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">Không có nhật ký kiểm toán nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            log.operation === "INSERT"
                              ? "default"
                              : log.operation === "UPDATE"
                                ? "secondary"
                                : log.operation === "DELETE"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {log.operation}
                        </Badge>
                        <span className="text-sm font-medium text-slate-700">{log.table_name}</span>
                        <span className="text-xs text-slate-400">#{log.record_id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Bởi: <span className="font-medium">{log.user_email}</span>
                        {log.user_role && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {log.user_role}
                          </Badge>
                        )}
                      </p>
                      {log.changed_fields && log.changed_fields.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Thay đổi: <span className="font-mono">{log.changed_fields.join(", ")}</span>
                        </p>
                      )}
                      {log.compliance_reason && (
                        <p className="text-xs text-slate-600 mt-1 italic">Lý do: {log.compliance_reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <Button asChild variant="ghost" size="sm" className="mt-2">
                        <Link href={`/dashboard/audit/${log.id}`}>Chi tiết</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
