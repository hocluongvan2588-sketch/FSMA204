"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  UserPlus,
  UserX,
  Shield,
  Building2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminAuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  description: string
  metadata: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  profiles: {
    full_name: string
    role: string
    company_id: string | null
  }
}

export default function AdminActivityDashboard() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("7days")
  const [stats, setStats] = useState({
    totalActions: 0,
    criticalActions: 0,
    userChanges: 0,
    todayActions: 0,
  })

  useEffect(() => {
    loadActivityLogs()
  }, [dateFilter, actionFilter, severityFilter])

  const loadActivityLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter !== "all") params.append("dateFilter", dateFilter)
      if (actionFilter !== "all") params.append("action", actionFilter)
      if (severityFilter !== "all") params.append("severity", severityFilter)

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("[v0] Error loading activity logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "user_create":
        return <UserPlus className="h-4 w-4 text-green-600" />
      case "user_delete":
        return <UserX className="h-4 w-4 text-red-600" />
      case "user_role_change":
        return <Shield className="h-4 w-4 text-orange-600" />
      case "company_create":
      case "company_update":
        return <Building2 className="h-4 w-4 text-blue-600" />
      case "facility_approve":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "facility_reject":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "2fa_enrolled":
      case "2fa_verified":
        return <Shield className="h-4 w-4 text-green-600" />
      case "2fa_failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-slate-600" />
    }
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      user_create: "Tạo người dùng",
      user_update: "Cập nhật người dùng",
      user_delete: "Xóa người dùng",
      user_role_change: "Thay đổi quyền",
      company_create: "Tạo công ty",
      company_update: "Cập nhật công ty",
      company_delete: "Xóa công ty",
      facility_approve: "Phê duyệt cơ sở",
      facility_reject: "Từ chối cơ sở",
      subscription_change: "Thay đổi gói dịch vụ",
      quota_override: "Override quota",
      "2fa_enrolled": "Đăng ký 2FA",
      "2fa_unenrolled": "Hủy 2FA",
      "2fa_verified": "Xác thực 2FA",
      "2fa_failed": "2FA thất bại",
      admin_login: "Đăng nhập admin",
      sensitive_data_access: "Truy cập dữ liệu nhạy cảm",
    }
    return labels[action] || action
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: "Nghiêm trọng",
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp",
    }
    return labels[severity] || severity
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.description.toLowerCase().includes(query) ||
      log.profiles.full_name.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query)
    )
  })

  const handleExport = () => {
    const csvContent = [
      ["Date", "Admin", "Role", "Action", "Description", "Severity", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toLocaleString("vi-VN"),
          log.profiles.full_name,
          log.profiles.role,
          getActionLabel(log.action),
          log.description,
          log.metadata?.severity || "medium",
          log.ip_address || "N/A",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `admin_activity_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto animate-pulse">
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-lg font-medium">Đang tải hoạt động admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Hoạt động Admin</h1>
          <p className="text-slate-500 mt-2 text-lg">Theo dõi và giám sát tất cả hoạt động quản trị trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadActivityLogs} className="bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" onClick={handleExport} className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tổng hoạt động</CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalActions}</div>
            <p className="text-xs text-slate-500 mt-1">
              Trong{" "}
              {dateFilter === "24hours"
                ? "24h"
                : dateFilter === "7days"
                  ? "7 ngày"
                  : dateFilter === "30days"
                    ? "30 ngày"
                    : "tất cả"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Hành động nghiêm trọng</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.criticalActions}</div>
            <p className="text-xs text-slate-500 mt-1">Cần chú ý đặc biệt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Thay đổi người dùng</CardTitle>
            <UserPlus className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.userChanges}</div>
            <p className="text-xs text-slate-500 mt-1">Tạo, sửa, xóa users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Hôm nay</CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayActions}</div>
            <p className="text-xs text-slate-500 mt-1">Hoạt động trong ngày</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm kiếm và lọc hoạt động admin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Khoảng thời gian</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24hours">24 giờ qua</SelectItem>
                  <SelectItem value="7days">7 ngày qua</SelectItem>
                  <SelectItem value="30days">30 ngày qua</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loại hành động</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="user_create">Tạo user</SelectItem>
                  <SelectItem value="user_delete">Xóa user</SelectItem>
                  <SelectItem value="user_role_change">Đổi quyền</SelectItem>
                  <SelectItem value="company_create">Tạo công ty</SelectItem>
                  <SelectItem value="facility_approve">Phê duyệt cơ sở</SelectItem>
                  <SelectItem value="2fa_enrolled">2FA enrolled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mức độ nghiêm trọng</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="critical">Nghiêm trọng</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm admin, mô tả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.criticalActions > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Cảnh báo:</strong> Có {stats.criticalActions} hành động nghiêm trọng cần xem xét. Kiểm tra kỹ các
            thay đổi về quyền và xóa dữ liệu.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nhật ký hoạt động</CardTitle>
          <CardDescription>
            {filteredLogs.length} hoạt động {searchQuery && `khớp với "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <Activity className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600">Không tìm thấy hoạt động nào</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="mt-1">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-medium">
                        {getActionLabel(log.action)}
                      </Badge>
                      {log.metadata?.severity && (
                        <Badge variant="outline" className={getSeverityColor(log.metadata.severity)}>
                          {getSeverityLabel(log.metadata.severity)}
                        </Badge>
                      )}
                      {log.profiles.role === "system_admin" && <Badge className="bg-purple-600">System Admin</Badge>}
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{log.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {log.profiles.full_name} ({log.profiles.role})
                      </span>
                      {log.ip_address && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {log.ip_address}
                        </span>
                      )}
                    </div>
                    {log.metadata?.changes && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          Xem chi tiết thay đổi
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded border text-xs">
                          <pre className="overflow-auto">{JSON.stringify(log.metadata.changes, null, 2)}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-500 flex-shrink-0">
                    <div>{new Date(log.created_at).toLocaleDateString("vi-VN")}</div>
                    <div>{new Date(log.created_at).toLocaleTimeString("vi-VN")}</div>
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
