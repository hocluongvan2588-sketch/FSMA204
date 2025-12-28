"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Shield,
  Activity,
  RefreshCw,
  Building2,
  PackageIcon,
  Warehouse,
  Tags,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { InventoryStockWidgetEnhanced } from "@/components/inventory-stock-widget-enhanced"
import { WasteDashboardWidget } from "@/components/waste-dashboard-widget"
import { ExpirationMonitorWidget } from "@/components/expiration-monitor-widget"
import { AuditTrailViewer } from "@/components/audit-trail-viewer"
import { MaterializedViewManager } from "@/lib/utils/materialized-view-manager"

interface AdminStats {
  totalUsers: number
  totalFacilities: number
  totalProducts: number
  totalSystemLogs: number
  adminCount: number
  totalCompanies?: number
  totalPackages?: number
  recentUsers?: any[]
}

interface UserProfile {
  id: string
  full_name: string
  role: string
  created_at: string
}

interface ProfileData {
  role: string
  company_id: string | null
  companies: {
    name: string
  } | null
}

interface FacilityDashboardStats {
  // Core metrics
  totalFacilities: number
  totalProducts: number
  totalTLCs: number
  totalCTEs: number

  // FSMA 204 Compliance metrics
  activeTLCs: number
  expiredTLCs: number
  tlcsWithCompleteCTEs: number
  tlcsWithMissingKDEs: number
  complianceScore: number

  // FDA Registration metrics
  fdaRegisteredFacilities: number
  fdaRegistrationsExpiring: number
  usAgentsActive: number
  usAgentsExpiring: number

  // Operational metrics
  operatorsCount: number
  managersCount: number
  recentAlertsCount: number
  storageUsagePercent: number
  currentStorageGB: number
  maxStorageGB: number
}

interface RecentActivity {
  id: string
  type: "tlc" | "cte" | "alert" | "fda"
  title: string
  description: string
  timestamp: string
  status: "success" | "warning" | "error"
  icon: any
}

export default function AdminDashboard() {
  const { locale, t } = useLanguage()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<FacilityDashboardStats>({
    totalFacilities: 0,
    totalProducts: 0,
    totalTLCs: 0,
    totalCTEs: 0,
    activeTLCs: 0,
    expiredTLCs: 0,
    tlcsWithCompleteCTEs: 0,
    tlcsWithMissingKDEs: 0,
    complianceScore: 0,
    fdaRegisteredFacilities: 0,
    fdaRegistrationsExpiring: 0,
    usAgentsActive: 0,
    usAgentsExpiring: 0,
    operatorsCount: 0,
    managersCount: 0,
    recentAlertsCount: 0,
    storageUsagePercent: 0,
    currentStorageGB: 0,
    maxStorageGB: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("[v0] Auth error:", authError)
        router.push("/auth/login")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, company_id, companies(name)")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Profile fetch error:", profileError)
        setIsLoading(false)
        return
      }

      if (profileData) {
        setProfile(profileData)

        const isSystemAdminUser = profileData.role === "system_admin"

        if (isSystemAdminUser) {
          const response = await fetch("/api/admin/stats")
          if (!response.ok) {
            throw new Error("Failed to fetch admin stats")
          }
          const adminStats = await response.json()

          setStats({
            totalUsers: adminStats.totalUsers || 0,
            totalCompanies: adminStats.totalCompanies || 0,
            totalFacilities: adminStats.totalFacilities || 0,
            totalProducts: adminStats.totalProducts || 0,
            totalTLCs: adminStats.totalTLCs || 0,
            totalCTEs: 0,
            activeTLCs: 0,
            expiredTLCs: 0,
            tlcsWithCompleteCTEs: 0,
            tlcsWithMissingKDEs: 0,
            complianceScore: 85,
            fdaRegisteredFacilities: 0,
            fdaRegistrationsExpiring: 0,
            usAgentsActive: 0,
            usAgentsExpiring: 0,
            operatorsCount: 0,
            managersCount: 0,
            recentAlertsCount: 0,
            storageUsagePercent: 0,
            currentStorageGB: 0,
            maxStorageGB: 0,
          })
        } else {
          const companyId = profileData.company_id

          if (!companyId) {
            console.error("[v0] No company_id found for user")
            setIsLoading(false)
            return
          }

          const [metrics, complianceAlerts] = await Promise.all([
            MaterializedViewManager.getDashboardMetrics(companyId),
            MaterializedViewManager.getComplianceAlerts(companyId),
          ])

          if (metrics) {
            setStats({
              totalFacilities: metrics.total_facilities || 0,
              totalProducts: metrics.total_products || 0,
              totalTLCs: metrics.total_tlcs || 0,
              totalCTEs: metrics.total_ctes || 0,
              activeTLCs: metrics.active_tlcs || 0,
              expiredTLCs: metrics.expired_tlcs || 0,
              tlcsWithCompleteCTEs: 0,
              tlcsWithMissingKDEs: complianceAlerts?.missing_kde_count || 0,
              complianceScore: 0,
              fdaRegisteredFacilities: metrics.fda_registered_facilities || 0,
              fdaRegistrationsExpiring: metrics.fda_registrations_expiring_soon || 0,
              usAgentsActive: metrics.active_us_agents || 0,
              usAgentsExpiring: metrics.us_agents_expiring_soon || 0,
              operatorsCount: metrics.operators_count || 0,
              managersCount: metrics.managers_count || 0,
              recentAlertsCount: complianceAlerts?.total_alerts || 0,
              storageUsagePercent: metrics.storage_usage_percent || 0,
              currentStorageGB: metrics.current_storage_gb || 0,
              maxStorageGB: metrics.max_storage_gb || 0,
            })

            const { data: recentLogs, error: logsError } = await supabase
              .from("activity_logs")
              .select(`
                *,
                profiles:user_id(company_id, full_name)
              `)
              .eq("profiles.company_id", companyId)
              .order("created_at", { ascending: false })
              .limit(5)

            if (logsError) {
              console.error("[v0] Activity logs fetch error:", logsError)
            }

            setRecentActivity(
              (recentLogs || []).map((log) => ({
                id: log.id,
                type: log.resource_type === "traceability_lots" ? "tlc" : "cte",
                title: log.action,
                description: `${log.resource_type || "Unknown"} - ${log.action}`,
                timestamp: log.created_at,
                status: log.action.includes("DELETE") ? "error" : "success",
                icon: log.resource_type === "traceability_lots" ? Tags : FileText,
              })),
            )
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      system_admin: "bg-purple-100 text-purple-700 border-purple-300",
      admin: "bg-red-100 text-red-700",
      manager: "bg-blue-100 text-blue-700",
      operator: "bg-green-100 text-green-700",
      viewer: "bg-gray-100 text-gray-700",
    }
    return colors[role] || colors.viewer
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getComplianceMessage = (score: number) => {
    if (score >= 90) return "Tốt - Tuân thủ đầy đủ"
    if (score >= 70) return "Trung bình - Cần cải thiện"
    return "Thấp - Cần hành động khẩn"
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  const isSystemAdmin = profile?.role === "system_admin"

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t("admin.overview.title")}</h1>
            {isSystemAdmin ? (
              <Badge className="bg-purple-600 text-white">{t("admin.overview.systemBadge")}</Badge>
            ) : (
              <Badge className="bg-red-600 text-white">{t("admin.overview.companyBadge")}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isSystemAdmin ? "Quản lý toàn bộ hệ thống FSMA 204" : t("admin.overview.description")}
          </p>
          {profile?.companies && !isSystemAdmin && (
            <div className="flex items-center gap-2 text-sm mt-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{(profile.companies as any).name}</span>
            </div>
          )}
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.actions.refresh")}
        </Button>
      </div>

      {isSystemAdmin && (
        <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold">System Admin Mode</p>
            <p className="text-sm">
              Bạn có quyền quản lý toàn bộ hệ thống. Để xem data nghiệp vụ của companies, vui lòng đăng nhập với tài
              khoản Company Admin.
            </p>
          </div>
        </div>
      )}

      {!isSystemAdmin && stats && (
        <>
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Tổng quan Tuân thủ FSMA 204
              </CardTitle>
              <CardDescription>Đánh giá tình trạng tuân thủ quy định FDA cho cơ sở của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Điểm Tuân thủ</p>
                    <p className={`text-4xl font-bold ${getComplianceColor(stats.complianceScore)}`}>
                      {stats.complianceScore}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{getComplianceMessage(stats.complianceScore)}</p>
                  </div>
                  <div className="text-right space-y-2">
                    {stats.fdaRegistrationsExpiring > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.fdaRegistrationsExpiring} FDA sắp hết hạn
                      </Badge>
                    )}
                    {stats.usAgentsExpiring > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.usAgentsExpiring} US Agent sắp hết hạn
                      </Badge>
                    )}
                    {stats.recentAlertsCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.recentAlertsCount} cảnh báo mới
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={stats.complianceScore} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/facilities")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cơ sở</CardTitle>
                <Warehouse className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalFacilities}</div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">{stats.fdaRegisteredFacilities} đã đăng ký FDA</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/products")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sản phẩm FTL</CardTitle>
                <PackageIcon className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-2">Sản phẩm cần truy xuất nguồn gốc</p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/traceability")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mã TLC</CardTitle>
                <Tags className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalTLCs}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-green-600 font-medium">{stats.activeTLCs} hoạt động</span>
                  {stats.expiredTLCs > 0 && (
                    <span className="text-xs text-red-600 font-medium">{stats.expiredTLCs} hết hạn</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/ctes")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sự kiện CTE</CardTitle>
                <FileText className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCTEs}</div>
                <p className="text-xs text-muted-foreground mt-2">Critical Tracking Events</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đăng ký FDA</CardTitle>
                <Shield className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Đã đăng ký:</span>
                    <span className="font-medium">
                      {stats.fdaRegisteredFacilities}/{stats.totalFacilities}
                    </span>
                  </div>
                  {stats.fdaRegistrationsExpiring > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600">Sắp hết hạn:</span>
                      <Badge variant="destructive">{stats.fdaRegistrationsExpiring}</Badge>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-transparent"
                    onClick={() => router.push("/admin/fda-registrations")}
                  >
                    Quản lý FDA →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">US Agent</CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hoạt động:</span>
                    <span className="font-medium">{stats.usAgentsActive}</span>
                  </div>
                  {stats.usAgentsExpiring > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600">Sắp hết hạn:</span>
                      <Badge variant="destructive">{stats.usAgentsExpiring}</Badge>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-transparent"
                    onClick={() => router.push("/admin/us-agents")}
                  >
                    Quản lý US Agent →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đội ngũ</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Operators:</span>
                    <span className="font-medium">{stats.operatorsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Managers:</span>
                    <span className="font-medium">{stats.managersCount}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-transparent"
                    onClick={() => router.push("/admin/users")}
                  >
                    Quản lý Users →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Dung lượng Lưu trữ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Đã sử dụng:</span>
                    <span className="font-medium">
                      {stats.currentStorageGB.toFixed(2)} / {stats.maxStorageGB} GB
                    </span>
                  </div>
                  <Progress value={stats.storageUsagePercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats.storageUsagePercent >= 90 ? (
                      <span className="text-red-600 font-medium">Cảnh báo: Gần đầy dung lượng!</span>
                    ) : stats.storageUsagePercent >= 75 ? (
                      <span className="text-yellow-600 font-medium">Lưu ý: Đã dùng hơn 75%</span>
                    ) : (
                      <span className="text-green-600">Dung lượng còn thoải mái</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Cảnh báo Gần đây
                </CardTitle>
                <CardDescription>Cảnh báo chất lượng dữ liệu trong 7 ngày qua</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentAlertsCount === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Không có cảnh báo mới</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold text-red-600">{stats.recentAlertsCount}</div>
                    <p className="text-sm text-muted-foreground mt-1">Cảnh báo cần xử lý</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 bg-transparent"
                      onClick={() => router.push("/dashboard/alerts")}
                    >
                      Xem chi tiết →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Week 6-7 widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WasteDashboardWidget />
            <ExpirationMonitorWidget />
          </div>

          {/* Enhanced Inventory Widget */}
          <InventoryStockWidgetEnhanced />

          {/* Audit Trail Viewer */}
          <AuditTrailViewer />

          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Hoạt động Gần đây
                </CardTitle>
                <CardDescription>Các thay đổi quan trọng trong hệ thống FSMA 204</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.timestamp).toLocaleString(locale)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            activity.status === "success"
                              ? "default"
                              : activity.status === "warning"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => router.push("/admin/system-logs")}
                >
                  Xem tất cả hoạt động →
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {isSystemAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/users")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tất cả users trong hệ thống</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/companies")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCompanies || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Công ty đang hoạt động</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/service-packages")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Facilities</CardTitle>
              <Warehouse className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFacilities || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tổng số cơ sở toàn hệ thống</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isSystemAdmin ? "Recent Users" : t("admin.overview.recentUsers.title")}</CardTitle>
          <CardDescription>
            {isSystemAdmin ? "Users mới đăng ký gần đây" : t("admin.overview.recentUsers.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentUsers?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("admin.users.noUsers")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.recentUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.overview.recentUsers.joined")} {new Date(user.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/admin/users")}>
            <Users className="h-4 w-4 mr-2" />
            {t("admin.users.viewAll")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
