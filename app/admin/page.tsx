"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Shield, Activity, RefreshCw, Building2, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface AdminStats {
  totalUsers: number
  totalFacilities: number
  totalProducts: number
  totalSystemLogs: number
  adminCount: number
  totalCompanies?: number
  totalPackages?: number
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

export default function AdminDashboard() {
  const { locale, t } = useLanguage()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([])
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
      } = await supabase.auth.getUser()

      if (!user) {
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
        setProfile(profileData as ProfileData)

        const isSystemAdminUser = profileData.role === "system_admin"

        if (isSystemAdminUser) {
          const [{ count: totalUsers }, { count: totalCompanies }, { count: totalPackages }, { data: allUsers }] =
            await Promise.all([
              supabase.from("profiles").select("*", { count: "exact", head: true }),
              supabase.from("companies").select("*", { count: "exact", head: true }),
              supabase.from("service_packages").select("*", { count: "exact", head: true }),
              supabase
                .from("profiles")
                .select("id, full_name, role, created_at")
                .order("created_at", { ascending: false })
                .limit(5),
            ])

          setStats({
            totalUsers: totalUsers || 0,
            adminCount: 0,
            totalSystemLogs: 0,
            totalFacilities: 0,
            totalProducts: 0,
            totalCompanies: totalCompanies || 0,
            totalPackages: totalPackages || 0,
          })
          setRecentUsers(allUsers || [])
        } else {
          // For company admins, use existing API
          const response = await fetch("/api/admin/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          })

          if (response.ok) {
            const statsData = await response.json()
            setStats(statsData.stats)
            setRecentUsers(statsData.recentUsers || [])
          }
        }
      }
    } catch (error) {
      console.error("[v0] Load data error:", error)
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

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isSystemAdmin ? (
          <>
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/admin/users")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
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
                <div className="text-3xl font-bold">{stats?.totalCompanies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Công ty đang hoạt động</p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/admin/service-packages")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Service Packages</CardTitle>
                <Package className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalPackages || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Gói dịch vụ có sẵn</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("admin.overview.stats.totalUsers")}</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.overview.stats.accountsInSystem")}</p>
                <Button variant="link" className="px-0 mt-2" onClick={() => router.push("/admin/users")}>
                  {t("common.actions.viewDetails")} →
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("admin.overview.stats.administrators")}</CardTitle>
                <Shield className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.adminCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("admin.overview.stats.systemAdminCount", { count: 0 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("admin.systemLogs.title")}</CardTitle>
                <Activity className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalSystemLogs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.systemLogs.recordedEvents")}</p>
                <Button variant="link" className="px-0 mt-2" onClick={() => router.push("/admin/system-logs")}>
                  {t("common.actions.viewDetails")} →
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isSystemAdmin ? "Recent Users" : t("admin.overview.recentUsers.title")}</CardTitle>
          <CardDescription>
            {isSystemAdmin ? "Users mới đăng ký gần đây" : t("admin.overview.recentUsers.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("admin.users.noUsers")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
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
