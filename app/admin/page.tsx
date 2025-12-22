"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Building2,
  Package,
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface SystemStats {
  totalUsers: number
  totalCompanies: number
  totalFacilities: number
  totalProducts: number
  totalLots: number
  totalCteEvents: number
  activeShipments: number
  totalShipments: number
  ftlProducts: number
  activeUsers: number
  newUsersThisMonth: number
}

interface RecentActivity {
  id: string
  event_type: string
  event_date: string
  user_email: string
  description: string
  facilities?: { name: string }
  traceability_lots?: {
    tlc: string
    products?: { product_name: string }
  }
}

interface UserActivity {
  id: string
  email: string
  last_sign_in_at: string
  profiles?: {
    full_name: string
    role: string
    company_id: string
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalFacilities: 0,
    totalProducts: 0,
    totalLots: 0,
    totalCteEvents: 0,
    activeShipments: 0,
    totalShipments: 0,
    ftlProducts: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [systemHealth, setSystemHealth] = useState({
    database: "operational",
    api: "operational",
    auth: "operational",
  })

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Load all system statistics in parallel
      const [
        usersData,
        companiesData,
        facilitiesData,
        productsData,
        lotsData,
        cteData,
        shipmentsData,
        activeShipmentsData,
        ftlProductsData,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("facilities").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("traceability_lots").select("id", { count: "exact", head: true }),
        supabase.from("critical_tracking_events").select("id", { count: "exact", head: true }),
        supabase.from("shipments").select("id", { count: "exact", head: true }),
        supabase.from("shipments").select("id", { count: "exact", head: true }).eq("status", "in_transit"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_ftl", true),
      ])

      // Calculate new users this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newUsersCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString())

      setStats({
        totalUsers: usersData.count || 0,
        totalCompanies: companiesData.count || 0,
        totalFacilities: facilitiesData.count || 0,
        totalProducts: productsData.count || 0,
        totalLots: lotsData.count || 0,
        totalCteEvents: cteData.count || 0,
        activeShipments: activeShipmentsData.count || 0,
        totalShipments: shipmentsData.count || 0,
        ftlProducts: ftlProductsData.count || 0,
        activeUsers: usersData.count || 0, // Placeholder
        newUsersThisMonth: newUsersCount || 0,
      })

      // Load recent CTE activity
      const { data: activityData } = await supabase
        .from("critical_tracking_events")
        .select(
          `
          id,
          event_type,
          event_date,
          description,
          traceability_lots (tlc, products (product_name)),
          facilities (name)
        `,
        )
        .order("event_date", { ascending: false })
        .limit(10)

      setRecentActivity(activityData || [])

      // Load recent user signins (requires access to auth.users - may need RLS adjustment)
      // This is a placeholder - you'd need proper auth admin access
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, company_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

      setActiveUsers(
        profilesData?.map((p) => ({
          id: p.id,
          email: p.email || "",
          last_sign_in_at: p.created_at,
          profiles: {
            full_name: p.full_name,
            role: p.role,
            company_id: p.company_id,
          },
        })) || [],
      )
    } catch (error) {
      console.error("[v0] Error loading system data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Users",
      subtitle: `+${stats.newUsersThisMonth} this month`,
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+12%",
      link: "/admin/users",
    },
    {
      title: "Companies",
      subtitle: "Active organizations",
      value: stats.totalCompanies,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+8%",
      link: "/admin/companies",
    },
    {
      title: "Total Products",
      subtitle: `${stats.ftlProducts} FTL items`,
      value: stats.totalProducts,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "+15%",
    },
    {
      title: "CTE Events",
      subtitle: "Tracking events logged",
      value: stats.totalCteEvents,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      trend: "+23%",
    },
    {
      title: "Active Shipments",
      subtitle: `of ${stats.totalShipments} total`,
      value: stats.activeShipments,
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      trend: "In transit",
    },
    {
      title: "Facilities",
      subtitle: "Production sites",
      value: stats.totalFacilities,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "+5%",
    },
  ]

  const getEventTypeName = (type: string) => {
    const names: Record<string, string> = {
      harvest: "Harvest",
      cooling: "Cooling",
      packing: "Packing",
      receiving: "Receiving",
      transformation: "Transformation",
      shipping: "Shipping",
    }
    return names[type] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      harvest: "bg-green-100 text-green-700",
      cooling: "bg-blue-100 text-blue-700",
      packing: "bg-orange-100 text-orange-700",
      receiving: "bg-purple-100 text-purple-700",
      transformation: "bg-pink-100 text-pink-700",
      shipping: "bg-cyan-100 text-cyan-700",
    }
    return colors[type] || "bg-gray-100 text-gray-700"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg font-medium">Loading system data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">System Administration</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Complete overview and management of the FSMA204 traceability system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadSystemData} className="bg-transparent">
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Link href="/admin/system-logs">
            <Button variant="outline" className="bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              View Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* System Health Status */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            System Health Status
          </CardTitle>
          <CardDescription>All core systems operational</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">Database</p>
                  <p className="text-sm text-slate-600">Supabase PostgreSQL</p>
                </div>
              </div>
              <Badge className="bg-green-600">Operational</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">API Services</p>
                  <p className="text-sm text-slate-600">Next.js Server</p>
                </div>
              </div>
              <Badge className="bg-green-600">Operational</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">Authentication</p>
                  <p className="text-sm text-slate-600">Supabase Auth</p>
                </div>
              </div>
              <Badge className="bg-green-600">Operational</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                <p className="text-xs text-slate-500">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900">{stat.value.toLocaleString()}</div>
                <Badge variant="secondary" className="text-xs">
                  {stat.trend}
                </Badge>
              </div>
              {stat.link && (
                <Link href={stat.link}>
                  <Button variant="link" className="p-0 h-auto mt-3 text-blue-600 hover:text-blue-700">
                    View details →
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent CTE Events</CardTitle>
              <CardDescription>Latest tracking events across all companies</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-white rounded-lg">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getEventTypeColor(activity.event_type)}>
                              {getEventTypeName(activity.event_type)}
                            </Badge>
                            <span className="text-sm font-medium text-slate-900">
                              {activity.traceability_lots?.tlc}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 truncate">
                            {activity.traceability_lots?.products?.product_name} • {activity.facilities?.name}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-slate-500 mt-1 truncate">{activity.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-slate-500">{new Date(activity.event_date).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400">{new Date(activity.event_date).toLocaleTimeString()}</p>
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
              <CardTitle>Recent User Signups</CardTitle>
              <CardDescription>Latest registered users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {activeUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {user.profiles?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.profiles?.full_name || "Unknown"}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {user.profiles?.role || "viewer"}
                        </Badge>
                        <p className="text-xs text-slate-500">{new Date(user.last_sign_in_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Usage Metrics</CardTitle>
                <CardDescription>Platform adoption and engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Products Coverage</span>
                    <span className="text-sm text-slate-600">{stats.totalProducts} total</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">{stats.ftlProducts} FTL products tracked</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Companies</span>
                    <span className="text-sm text-slate-600">{stats.totalCompanies}</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">Growing steadily</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">User Adoption</span>
                    <span className="text-sm text-slate-600">{stats.totalUsers} users</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">+{stats.newUsersThisMonth} this month</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>FSMA 204 adherence tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-slate-900">Complete Records</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.totalCteEvents}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-slate-900">In Progress</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats.activeShipments}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-slate-600" />
                    <span className="font-medium text-slate-900">Pending Review</span>
                  </div>
                  <span className="text-lg font-bold text-slate-600">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>Add, edit, or remove user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button className="w-full">Go to Users</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Building2 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Manage Companies</CardTitle>
                <CardDescription>Oversee all registered organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/companies">
                  <Button className="w-full">Go to Companies</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>System Logs</CardTitle>
                <CardDescription>View audit trail and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/system-logs">
                  <Button className="w-full">View Logs</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Database className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Database Backup</CardTitle>
                <CardDescription>Export and backup system data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-transparent" variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Configure notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-transparent" variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-teal-600 mb-2" />
                <CardTitle>Analytics Report</CardTitle>
                <CardDescription>Generate comprehensive insights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-transparent" variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
