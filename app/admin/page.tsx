"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Activity, Shield, Database, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface SystemStats {
  totalUsers: number
  totalCompanies: number
  totalFacilities: number
  systemAdmins: number
  companyAdmins: number
  activeUsers: number
  totalSystemLogs: number
}

interface RecentUser {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  company_id: string | null
  companies?: { name: string } | null
}

export default function AdminDashboardPage() {
  const { language } = useLanguage()
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalFacilities: 0,
    systemAdmins: 0,
    companyAdmins: 0,
    activeUsers: 0,
    totalSystemLogs: 0,
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<{ email: string; companyName: string | null }>({
    email: "",
    companyName: null,
  })

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("[v0] No user found in admin page")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, company_id, companies(name)")
        .eq("id", user.id)
        .single()

      if (!profile) {
        console.error("[v0] No profile found")
        return
      }

      setUserRole(profile.role)
      setCurrentUser({
        email: user.email || "",
        companyName: profile.companies?.name || null,
      })
      console.log("[v0] Admin page loaded with role:", profile.role, "email:", user.email)

      // Load statistics
      const [usersData, companiesData, facilitiesData, systemAdminsData, companyAdminsData, systemLogsData] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("companies").select("id", { count: "exact", head: true }),
          supabase.from("facilities").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "system_admin"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
          supabase.from("system_logs").select("id", { count: "exact", head: true }),
        ])

      setStats({
        totalUsers: usersData.count || 0,
        totalCompanies: companiesData.count || 0,
        totalFacilities: facilitiesData.count || 0,
        systemAdmins: systemAdminsData.count || 0,
        companyAdmins: companyAdminsData.count || 0,
        activeUsers: usersData.count || 0,
        totalSystemLogs: systemLogsData.count || 0,
      })

      // Load recent users
      let recentUsersQuery = supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          role,
          created_at,
          company_id,
          companies (name)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5)

      // If company admin, only show users from their company
      if (profile.role === "admin" && profile.company_id) {
        recentUsersQuery = recentUsersQuery.eq("company_id", profile.company_id)
      }

      const { data: usersListData } = await recentUsersQuery

      setRecentUsers(usersListData || [])
      console.log("[v0] Admin data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isSystemAdmin = userRole === "system_admin"

  const statCards = [
    {
      title: language === "vi" ? "Tổng người dùng" : "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/admin/users",
      description: language === "vi" ? "Tài khoản trong hệ thống" : "Accounts in system",
    },
    {
      title: language === "vi" ? "Công ty" : "Companies",
      value: stats.totalCompanies,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/companies",
      description: language === "vi" ? "Tổ chức đăng ký" : "Registered organizations",
      systemAdminOnly: true,
    },
    {
      title: language === "vi" ? "Quản trị viên" : "Administrators",
      value: stats.companyAdmins + stats.systemAdmins,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: language === "vi" ? `${stats.systemAdmins} hệ thống` : `${stats.systemAdmins} system`,
    },
    {
      title: language === "vi" ? "Nhật ký hệ thống" : "System Logs",
      value: stats.totalSystemLogs,
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/admin/system-logs",
      description: language === "vi" ? "Sự kiện ghi nhận" : "Recorded events",
    },
  ]

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      system_admin: "bg-purple-100 text-purple-700 border-purple-200",
      admin: "bg-red-100 text-red-700 border-red-200",
      manager: "bg-blue-100 text-blue-700 border-blue-200",
      operator: "bg-green-100 text-green-700 border-green-200",
      viewer: "bg-slate-100 text-slate-700 border-slate-200",
    }
    return colors[role] || "bg-slate-100 text-slate-700"
  }

  const getRoleDisplayName = (role: string) => {
    if (language === "vi") {
      const names: Record<string, string> = {
        system_admin: "System Admin",
        admin: "Admin",
        manager: "Quản lý",
        operator: "Nhân viên",
        viewer: "Người xem",
      }
      return names[role] || role
    }
    return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto animate-pulse">
            <Database className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-lg font-medium">{language === "vi" ? "Đang tải dữ liệu..." : "Loading data..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-slate-900">
              {language === "vi" ? "Bảng điều khiển quản trị" : "Administration Dashboard"}
            </h1>
            <Badge className={isSystemAdmin ? "bg-purple-600" : "bg-red-600"}>
              {isSystemAdmin ? (language === "vi" ? "HỆ THỐNG" : "SYSTEM") : language === "vi" ? "CÔNG TY" : "COMPANY"}
            </Badge>
          </div>
          <p className="text-slate-500 text-lg">
            {isSystemAdmin
              ? language === "vi"
                ? "Quản lý toàn bộ hệ thống và tổ chức"
                : "Manage entire system and organizations"
              : language === "vi"
                ? "Quản lý người dùng và cài đặt công ty"
                : "Manage users and company settings"}
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
            {currentUser.email && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {currentUser.email}
              </span>
            )}
            {currentUser.companyName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {currentUser.companyName}
              </span>
            )}
            {!currentUser.companyName && !isSystemAdmin && (
              <span className="flex items-center gap-1 text-orange-600">
                <Building2 className="h-4 w-4" />
                {language === "vi" ? "Chưa có công ty" : "No company assigned"}
              </span>
            )}
          </div>
        </div>
        <Button onClick={loadSystemData} variant="outline" className="bg-transparent">
          <Activity className="h-4 w-4 mr-2" />
          {language === "vi" ? "Làm mới" : "Refresh"}
        </Button>
      </div>

      {/* System Health - Only for System Admin */}
      {isSystemAdmin && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {language === "vi" ? "Trạng thái hệ thống" : "System Health"}
            </CardTitle>
            <CardDescription>
              {language === "vi" ? "Tất cả dịch vụ hoạt động bình thường" : "All services operational"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-900">{language === "vi" ? "Cơ sở dữ liệu" : "Database"}</p>
                    <p className="text-sm text-slate-600">Supabase PostgreSQL</p>
                  </div>
                </div>
                <Badge className="bg-green-600">{language === "vi" ? "Hoạt động" : "Online"}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-900">{language === "vi" ? "Dịch vụ API" : "API Service"}</p>
                    <p className="text-sm text-slate-600">Next.js Server</p>
                  </div>
                </div>
                <Badge className="bg-green-600">{language === "vi" ? "Hoạt động" : "Online"}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-900">{language === "vi" ? "Xác thực" : "Authentication"}</p>
                    <p className="text-sm text-slate-600">Supabase Auth</p>
                  </div>
                </div>
                <Badge className="bg-green-600">{language === "vi" ? "Hoạt động" : "Online"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards
          .filter((stat) => !stat.systemAdminOnly || isSystemAdmin)
          .map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-900">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-slate-500">{stat.description}</p>
                  {stat.link && (
                    <Link href={stat.link}>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                        {language === "vi" ? "Xem chi tiết" : "View details"} →
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "vi" ? "Người dùng mới nhất" : "Recent Users"}</CardTitle>
          <CardDescription>
            {language === "vi" ? "Tài khoản đăng ký gần đây" : "Recently registered accounts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600">{language === "vi" ? "Chưa có người dùng" : "No users yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.full_name || user.email || "N/A"}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                      {user.companies?.name && <p className="text-xs text-slate-500 mt-1">{user.companies.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleBadgeColor(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                    <p className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                {language === "vi" ? "Xem tất cả người dùng" : "View all users"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "vi" ? "Thao tác nhanh" : "Quick Actions"}</CardTitle>
          <CardDescription>
            {language === "vi" ? "Các chức năng quản trị chính" : "Primary admin functions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-start gap-2 bg-transparent">
                <Users className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold">{language === "vi" ? "Quản lý người dùng" : "Manage Users"}</div>
                  <div className="text-xs text-slate-500">
                    {language === "vi" ? "Thêm, sửa, xóa tài khoản" : "Add, edit, remove accounts"}
                  </div>
                </div>
              </Button>
            </Link>

            {isSystemAdmin && (
              <Link href="/admin/companies">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-start gap-2 bg-transparent">
                  <Building2 className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold">{language === "vi" ? "Quản lý công ty" : "Manage Companies"}</div>
                    <div className="text-xs text-slate-500">
                      {language === "vi" ? "Xem và chỉnh sửa tổ chức" : "View and edit organizations"}
                    </div>
                  </div>
                </Button>
              </Link>
            )}

            <Link href="/admin/system-logs">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-start gap-2 bg-transparent">
                <Activity className="h-6 w-6 text-orange-600" />
                <div className="text-left">
                  <div className="font-semibold">{language === "vi" ? "Xem nhật ký" : "View Logs"}</div>
                  <div className="text-xs text-slate-500">
                    {language === "vi" ? "Theo dõi hoạt động hệ thống" : "Track system activity"}
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
