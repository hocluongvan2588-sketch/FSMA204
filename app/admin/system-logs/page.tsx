"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle,
  Info,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Database,
  Search,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SystemLog {
  id: string
  event_type: string
  event_date: string
  description?: string
  facility_id?: string
  responsible_person?: string
  facilities?: { name: string; company_id: string }
  traceability_lots?: { tlc: string }
}

interface AuditReport {
  id: string
  report_number: string
  audit_date: string
  auditor_name: string
  compliance_status: string
  facilities?: { name: string }
}

interface UserActivity {
  id: string
  full_name: string
  role: string
  created_at: string
  company_id?: string
}

export default function SystemLogsPage() {
  const { language } = useLanguage()
  const [cteEvents, setCteEvents] = useState<SystemLog[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("7days")

  useEffect(() => {
    loadSystemLogs()
  }, [dateFilter])

  const loadSystemLogs = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Calculate date range
      const now = new Date()
      const dateLimit = new Date()
      switch (dateFilter) {
        case "24hours":
          dateLimit.setHours(now.getHours() - 24)
          break
        case "7days":
          dateLimit.setDate(now.getDate() - 7)
          break
        case "30days":
          dateLimit.setDate(now.getDate() - 30)
          break
        case "all":
          dateLimit.setFullYear(2000)
          break
      }

      // Load CTE events (main activity log)
      const { data: cteData } = await supabase
        .from("critical_tracking_events")
        .select(
          `
          id,
          event_type,
          event_date,
          description,
          responsible_person,
          facility_id,
          facilities (name, company_id),
          traceability_lots (tlc)
        `,
        )
        .gte("event_date", dateLimit.toISOString())
        .order("event_date", { ascending: false })
        .limit(100)

      setCteEvents(cteData || [])

      // Load audit reports
      const { data: auditData } = await supabase
        .from("audit_reports")
        .select(
          `
          id,
          report_number,
          audit_date,
          auditor_name,
          compliance_status,
          facilities (name)
        `,
        )
        .gte("audit_date", dateLimit.toISOString().split("T")[0])
        .order("audit_date", { ascending: false })
        .limit(50)

      setAuditReports(auditData || [])

      // Load recent user registrations
      const { data: userData } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at, company_id")
        .gte("created_at", dateLimit.toISOString())
        .order("created_at", { ascending: false })
        .limit(50)

      setUserActivities(userData || [])
    } catch (error) {
      console.error("[v0] Error loading system logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "harvest":
      case "cooling":
      case "packing":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "transformation":
      case "receiving":
        return <Activity className="h-5 w-5 text-blue-600" />
      case "shipping":
        return <Info className="h-5 w-5 text-purple-600" />
      default:
        return <Info className="h-5 w-5 text-slate-600" />
    }
  }

  const getEventTypeName = (type: string) => {
    const names: Record<string, { vi: string; en: string }> = {
      harvest: { vi: "Thu hoạch", en: "Harvest" },
      cooling: { vi: "Làm lạnh", en: "Cooling" },
      packing: { vi: "Đóng gói", en: "Packing" },
      receiving: { vi: "Tiếp nhận", en: "Receiving" },
      transformation: { vi: "Chế biến", en: "Transformation" },
      shipping: { vi: "Vận chuyển", en: "Shipping" },
    }
    return names[type]?.[language] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      harvest: "bg-green-100 text-green-700 border-green-200",
      cooling: "bg-blue-100 text-blue-700 border-blue-200",
      packing: "bg-orange-100 text-orange-700 border-orange-200",
      receiving: "bg-purple-100 text-purple-700 border-purple-200",
      transformation: "bg-pink-100 text-pink-700 border-pink-200",
      shipping: "bg-cyan-100 text-cyan-700 border-cyan-200",
    }
    return colors[type] || "bg-slate-100 text-slate-700 border-slate-200"
  }

  const getComplianceColor = (status: string) => {
    const colors: Record<string, string> = {
      compliant: "bg-green-100 text-green-700",
      non_compliant: "bg-red-100 text-red-700",
      requires_action: "bg-yellow-100 text-yellow-700",
    }
    return colors[status] || "bg-slate-100 text-slate-700"
  }

  const filteredEvents = cteEvents.filter((event) => {
    if (filterType !== "all" && event.event_type !== filterType) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        event.event_type.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.responsible_person?.toLowerCase().includes(query) ||
        event.facilities?.name.toLowerCase().includes(query) ||
        event.traceability_lots?.tlc.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleExportLogs = () => {
    // Prepare CSV data
    const csvContent = [
      ["Date", "Event Type", "Description", "Facility", "TLC", "Responsible Person"].join(","),
      ...filteredEvents.map((event) =>
        [
          new Date(event.event_date).toLocaleString(),
          getEventTypeName(event.event_type),
          event.description || "-",
          event.facilities?.name || "-",
          event.traceability_lots?.tlc || "-",
          event.responsible_person || "-",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n")

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `system_logs_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg font-medium">{language === "vi" ? "Đang tải nhật ký..." : "Loading logs..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {language === "vi" ? "Nhật ký Hệ thống" : "System Logs"}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {language === "vi"
              ? "Theo dõi và phân tích toàn bộ hoạt động trong hệ thống"
              : "Monitor and analyze all system activities"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadSystemLogs} className="bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === "vi" ? "Làm mới" : "Refresh"}
          </Button>
          <Button variant="outline" onClick={handleExportLogs} className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            {language === "vi" ? "Xuất CSV" : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {language === "vi" ? "Sự kiện CTE" : "CTE Events"}
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cteEvents.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {language === "vi" ? `Trong ${dateFilter}` : `In ${dateFilter}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {language === "vi" ? "Kiểm toán" : "Audits"}
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{auditReports.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {language === "vi" ? "Báo cáo tuân thủ" : "Compliance reports"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {language === "vi" ? "Người dùng mới" : "New Users"}
            </CardTitle>
            <User className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userActivities.length}</div>
            <p className="text-xs text-slate-500 mt-1">{language === "vi" ? "Đăng ký" : "Registrations"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {language === "vi" ? "Trạng thái" : "Status"}
            </CardTitle>
            <Database className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-600 text-white">{language === "vi" ? "Hoạt động" : "Active"}</Badge>
            <p className="text-xs text-slate-500 mt-2">{language === "vi" ? "Hệ thống ổn định" : "System stable"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "vi" ? "Khoảng thời gian" : "Time Range"}</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24hours">{language === "vi" ? "24 giờ qua" : "Last 24 hours"}</SelectItem>
                  <SelectItem value="7days">{language === "vi" ? "7 ngày qua" : "Last 7 days"}</SelectItem>
                  <SelectItem value="30days">{language === "vi" ? "30 ngày qua" : "Last 30 days"}</SelectItem>
                  <SelectItem value="all">{language === "vi" ? "Tất cả" : "All time"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "vi" ? "Loại sự kiện" : "Event Type"}</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "vi" ? "Tất cả" : "All Events"}</SelectItem>
                  <SelectItem value="harvest">{language === "vi" ? "Thu hoạch" : "Harvest"}</SelectItem>
                  <SelectItem value="cooling">{language === "vi" ? "Làm lạnh" : "Cooling"}</SelectItem>
                  <SelectItem value="packing">{language === "vi" ? "Đóng gói" : "Packing"}</SelectItem>
                  <SelectItem value="receiving">{language === "vi" ? "Tiếp nhận" : "Receiving"}</SelectItem>
                  <SelectItem value="transformation">{language === "vi" ? "Chế biến" : "Transformation"}</SelectItem>
                  <SelectItem value="shipping">{language === "vi" ? "Vận chuyển" : "Shipping"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">{language === "vi" ? "Tìm kiếm" : "Search"}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={
                    language === "vi"
                      ? "Tìm theo TLC, mô tả, người phụ trách..."
                      : "Search by TLC, description, person..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="events">
            {language === "vi" ? "Sự kiện CTE" : "CTE Events"} ({filteredEvents.length})
          </TabsTrigger>
          <TabsTrigger value="audits">
            {language === "vi" ? "Kiểm toán" : "Audits"} ({auditReports.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            {language === "vi" ? "Người dùng" : "Users"} ({userActivities.length})
          </TabsTrigger>
        </TabsList>

        {/* CTE Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "vi" ? "Nhật ký Sự kiện" : "Event Logs"}</CardTitle>
              <CardDescription>
                {language === "vi"
                  ? `${filteredEvents.length} sự kiện được tìm thấy`
                  : `${filteredEvents.length} events found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600">{language === "vi" ? "Không có sự kiện nào" : "No events found"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="mt-1">{getEventIcon(event.event_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getEventTypeColor(event.event_type)} variant="outline">
                            {getEventTypeName(event.event_type)}
                          </Badge>
                          {event.traceability_lots?.tlc && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {event.traceability_lots.tlc}
                            </Badge>
                          )}
                        </div>
                        {event.description && <p className="text-sm text-slate-700 mb-2">{event.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {event.facilities?.name && (
                            <span className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {event.facilities.name}
                            </span>
                          )}
                          {event.responsible_person && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.responsible_person}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500 flex-shrink-0">
                        <div>
                          {new Date(event.event_date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                        </div>
                        <div>
                          {new Date(event.event_date).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Reports Tab */}
        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "vi" ? "Báo cáo Kiểm toán" : "Audit Reports"}</CardTitle>
              <CardDescription>
                {language === "vi" ? "Lịch sử kiểm toán tuân thủ" : "Compliance audit history"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditReports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">{language === "vi" ? "Chưa có báo cáo" : "No reports yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold">{report.report_number}</span>
                          <Badge className={getComplianceColor(report.compliance_status)}>
                            {report.compliance_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {language === "vi" ? "Kiểm toán viên" : "Auditor"}: {report.auditor_name}
                        </p>
                        {report.facilities?.name && <p className="text-xs text-slate-500">{report.facilities.name}</p>}
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(report.audit_date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "vi" ? "Hoạt động Người dùng" : "User Activity"}</CardTitle>
              <CardDescription>
                {language === "vi" ? "Người dùng mới đăng ký" : "New user registrations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userActivities.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">{language === "vi" ? "Chưa có hoạt động" : "No activity yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userActivities.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
