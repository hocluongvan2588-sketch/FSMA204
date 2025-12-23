import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { QuickActions } from "@/components/quick-actions"
import { Package, Building2, Tag, Truck, TrendingUp, TrendingDown } from "lucide-react"
import { FDATimelineChart } from "@/components/fda-timeline-chart"
import { FSMAComplianceChart } from "@/components/fsma-compliance-chart"
import { DailyGreeting } from "@/components/daily-greeting"
import { FSMATour } from "@/components/fsma-tour"

export default async function DashboardPage() {
  const supabase = await createClient()

  const authResult = await Promise.race([
    supabase.auth.getUser(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000)),
  ]).catch((error) => {
    console.error("[v0] Auth timeout or error:", error)
    return { data: { user: null }, error }
  })

  const {
    data: { user },
    error: authError,
  } = authResult as any

  if (authError) {
    console.error("[v0] Auth error:", authError.message)
  }

  if (!user) {
    console.log("[v0] No user found, showing default dashboard")
    return <DefaultDashboard />
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies(name, registration_number)")
    .eq("id", user.id)
    .single()

  console.log("[v0] Profile found for user:", user.email)

  if (profile?.role === "manager") {
    redirect("/dashboard/manager")
  }
  if (profile?.role === "operator") {
    redirect("/dashboard/operator")
  }
  if (profile?.role === "viewer") {
    redirect("/dashboard/viewer")
  }

  let facilitiesCount = 0
  let productsCount = 0
  let lotsCount = 0
  let shipmentsCount = 0
  let fdaRegistrations: any[] = []
  let totalLots = 0
  let lotsWithKDE = 0
  let recentActivities: any[] = []

  try {
    const [facilities, products, lots, shipments, registrations, kdeStatsResult, activities] = await Promise.all([
      supabase.from("facilities").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("traceability_lots").select("*", { count: "exact", head: true }),
      supabase.from("shipments").select("*", { count: "exact", head: true }),

      supabase
        .from("fda_registrations")
        .select("*, facilities(name)")
        .order("renewal_date", { ascending: true })
        .limit(5),

      supabase.rpc("calculate_kde_compliance"),

      supabase
        .from("critical_tracking_events")
        .select(`
          *,
          traceability_lots(tlc, products(product_name)),
          facilities(name)
        `)
        .order("event_date", { ascending: false })
        .limit(10),
    ])

    facilitiesCount = facilities.count || 0
    productsCount = products.count || 0
    lotsCount = lots.count || 0
    shipmentsCount = shipments.count || 0
    fdaRegistrations = (registrations.data || []).map((reg: any) => ({
      id: reg.id,
      facility_name: reg.facilities?.name || "Unknown Facility",
      registration_date: reg.registration_date,
      renewal_date: reg.renewal_date,
      expiry_date: reg.expiry_date,
      fda_registration_number: reg.fda_registration_number,
    }))

    if (kdeStatsResult.data && !kdeStatsResult.error) {
      const stats = kdeStatsResult.data[0]
      totalLots = stats?.total || lotsCount
      lotsWithKDE = stats?.with_kde || 0
    } else {
      console.log("[v0] KDE stats error or no data:", kdeStatsResult.error)
      totalLots = lotsCount
      lotsWithKDE = 0
    }

    recentActivities = activities.data || []
  } catch (error) {
    console.error("[v0] Dashboard data fetch error:", error)
  }

  const kpiData = [
    {
      title: "Cơ sở",
      value: facilitiesCount,
      change: "+5%",
      changeType: "increase" as const,
      icon: Building2,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      textColor: "text-emerald-700",
    },
    {
      title: "Sản phẩm",
      value: productsCount,
      change: "+12%",
      changeType: "increase" as const,
      icon: Package,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-700",
    },
    {
      title: "Mã TLC",
      value: lotsCount,
      change: "+8%",
      changeType: "increase" as const,
      icon: Tag,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      textColor: "text-purple-700",
    },
    {
      title: "Vận chuyển",
      value: shipmentsCount,
      change: "-2%",
      changeType: "decrease" as const,
      icon: Truck,
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-50 to-amber-100",
      textColor: "text-amber-700",
    },
  ]

  return (
    <div className="space-y-8 pb-8">
      <div data-tour="daily-greeting">
        <DailyGreeting userName={profile?.full_name} autoRotate={true} rotateInterval={30000} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-tour="kpi-cards">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card
              key={kpi.title}
              data-tour={kpi.title === "Mã TLC" ? "tlc-codes" : undefined}
              className={`rounded-3xl shadow-lg shadow-slate-900/5 border-0 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br ${kpi.bgGradient} dark:from-slate-800 dark:to-slate-900`}
            >
              <CardContent className="p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${kpi.changeType === "increase" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:border-red-800"} font-semibold border`}
                  >
                    {kpi.changeType === "increase" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {kpi.change}
                  </Badge>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${kpi.textColor} dark:text-slate-400 mb-1`}>{kpi.title}</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div data-tour="quick-actions">
        <h2 className="text-2xl font-bold text-foreground mb-4">Thao tác nhanh</h2>
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FDATimelineChart registrations={fdaRegistrations} />
        <FSMAComplianceChart totalLots={totalLots} lotsWithKDE={lotsWithKDE} />
      </div>

      <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Bảng hoạt động sản xuất</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">10 bản ghi mới nhất từ hệ thống sản xuất</p>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-transparent rounded-xl">
            <Link href="/dashboard/cte">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-1">Bắt đầu theo dõi ngay!</p>
                <p className="text-sm text-slate-500 mb-4">Tạo sự kiện CTE đầu tiên theo chuẩn FSMA 204</p>
              </div>
              <Button asChild className="rounded-xl">
                <Link href="/dashboard/cte/create">Tạo sự kiện đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Sự kiện (CTE)
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Sản phẩm / TLC
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Cơ sở
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Ngày
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => {
                    const eventTypeMap: Record<string, { label: string; color: string }> = {
                      harvest: { label: "Harvesting", color: "bg-emerald-100 text-emerald-700" },
                      cooling: { label: "Cooling", color: "bg-blue-100 text-blue-700" },
                      packing: { label: "Initial Packing", color: "bg-purple-100 text-purple-700" },
                      receiving: { label: "Receiving", color: "bg-amber-100 text-amber-700" },
                      transformation: { label: "Transformation", color: "bg-pink-100 text-pink-700" },
                      shipping: { label: "Shipping", color: "bg-cyan-100 text-cyan-700" },
                    }

                    const eventInfo = eventTypeMap[activity.event_type] || {
                      label: activity.event_type,
                      color: "bg-slate-100 text-slate-700",
                    }

                    return (
                      <tr
                        key={activity.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <Badge variant="secondary" className={`${eventInfo.color} rounded-lg`}>
                            {eventInfo.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {activity.traceability_lots?.products?.product_name || "N/A"}
                          </p>
                          <p className="text-xs text-slate-500">{activity.traceability_lots?.tlc}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
                          {activity.facilities?.name || "N/A"}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
                          {new Date(activity.event_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-4 px-4">
                          {activity.key_data_elements && activity.key_data_elements.length > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 rounded-lg">
                              Đạt
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="rounded-lg">
                              Thiếu KDE
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {profile?.companies && (
        <Card className="rounded-3xl shadow-lg shadow-slate-900/5" data-tour="company-info">
          <CardHeader>
            <CardTitle className="text-xl">Thông tin công ty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tên công ty</p>
                <p className="text-lg font-semibold text-foreground">{profile.companies.name}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <p className="text-sm font-medium text-muted-foreground mb-2">Mã số thuế</p>
                <p className="text-lg font-semibold text-foreground">{profile.companies.registration_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <FSMATour autoStart={true} />
    </div>
  )
}

function DefaultDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground">Chào mừng đến với FSMA 204!</h1>
          <p className="text-muted-foreground text-lg mt-2">Vui lòng đăng nhập để xem thông tin dashboard của bạn</p>
        </div>
      </div>

      <Card className="rounded-3xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Bắt đầu theo dõi ngay</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Đăng nhập để truy cập hệ thống theo dõi sản phẩm và quản lý dữ liệu FSMA 204
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-2xl px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            <Link href="/auth/login">Đăng nhập ngay</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
