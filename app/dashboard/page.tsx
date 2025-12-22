import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get profile with company
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies(name, registration_number)")
    .eq("id", user!.id)
    .single()

  // Get stats
  const { count: facilitiesCount } = await supabase.from("facilities").select("*", { count: "exact", head: true })

  const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

  const { count: ftlCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_ftl", true)

  const { count: lotsCount } = await supabase.from("traceability_lots").select("*", { count: "exact", head: true })

  const { count: activeLotsCount } = await supabase
    .from("traceability_lots")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: cteCount } = await supabase
    .from("critical_tracking_events")
    .select("*", { count: "exact", head: true })

  const { count: shipmentsCount } = await supabase.from("shipments").select("*", { count: "exact", head: true })

  const { count: inTransitCount } = await supabase
    .from("shipments")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_transit")

  // Get recent CTEs
  const { data: recentCTEs } = await supabase
    .from("critical_tracking_events")
    .select("*, traceability_lots(tlc, products(product_name)), facilities(name)")
    .order("event_date", { ascending: false })
    .limit(5)

  // Get recent shipments
  const { data: recentShipments } = await supabase
    .from("shipments")
    .select("*, traceability_lots(tlc, products(product_name))")
    .order("shipment_date", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Chào mừng trở lại!</h1>
        <p className="text-slate-500 mt-1">Xin chào {profile?.full_name}, đây là hoạt động mới nhất của bạn</p>
      </div>

      {/* Quick Actions section at the top */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-6 border border-blue-100">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-teal-600">
            <Link href="/dashboard/cte/create">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo sự kiện CTE mới
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white">
            <Link href="/dashboard/lots/create">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm lô hàng mới
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white">
            <Link href="/dashboard/shipments/create">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo vận chuyển
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white">
            <Link href="/dashboard/reports/generate">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Xuất báo cáo
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cơ sở</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilitiesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Cơ sở sản xuất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sản phẩm</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount || 0}</div>
            <p className="text-xs text-muted-foreground">{ftlCount || 0} sản phẩm FTL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mã TLC</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotsCount || 0}</div>
            <p className="text-xs text-muted-foreground">{activeLotsCount || 0} lô đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vận chuyển</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipmentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">{inTransitCount || 0} đang vận chuyển</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        {profile?.companies && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin công ty</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Tên công ty</dt>
                  <dd className="mt-1 text-base text-slate-900">{profile.companies.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Mã số thuế</dt>
                  <dd className="mt-1 text-base text-slate-900">{profile.companies.registration_number}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Tình hình hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Sự kiện theo dõi</span>
                <span className="text-2xl font-bold text-blue-600">{cteCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Đang vận chuyển</span>
                <span className="text-2xl font-bold text-teal-600">{inTransitCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Lô hàng đang sản xuất</span>
                <span className="text-2xl font-bold text-indigo-600">{activeLotsCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent CTEs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hoạt động gần đây</CardTitle>
          <Button asChild size="sm" variant="outline" className="bg-transparent">
            <Link href="/dashboard/cte">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recentCTEs || recentCTEs.length === 0 ? (
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
                <p className="text-sm text-slate-500 mb-4">Tạo sự kiện CTE đầu tiên trong 30 giây</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/cte/create">Tạo sự kiện đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCTEs.map((cte) => (
                <div key={cte.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="capitalize">
                        {cte.event_type === "harvest"
                          ? "Thu hoạch"
                          : cte.event_type === "cooling"
                            ? "Làm lạnh"
                            : cte.event_type === "packing"
                              ? "Đóng gói"
                              : cte.event_type === "receiving"
                                ? "Tiếp nhận"
                                : cte.event_type === "transformation"
                                  ? "Chế biến"
                                  : "Vận chuyển"}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {new Date(cte.event_date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {cte.traceability_lots?.products?.product_name} - {cte.traceability_lots?.tlc}
                    </p>
                    <p className="text-xs text-slate-500">{cte.facilities?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vận chuyển gần đây</CardTitle>
          <Button asChild size="sm" variant="outline" className="bg-transparent">
            <Link href="/dashboard/shipments">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recentShipments || recentShipments.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-1">Chưa có vận chuyển nào</p>
                <p className="text-sm text-slate-500 mb-4">Tạo lô hàng và bắt đầu vận chuyển ngay</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/shipments/create">Tạo vận chuyển mới</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">{shipment.shipment_number}</p>
                      <Badge
                        variant={
                          shipment.status === "delivered"
                            ? "default"
                            : shipment.status === "in_transit"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {shipment.status === "delivered"
                          ? "Đã giao"
                          : shipment.status === "in_transit"
                            ? "Đang vận chuyển"
                            : "Chờ xử lý"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700">
                      {shipment.traceability_lots?.products?.product_name} - {shipment.traceability_lots?.tlc}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(shipment.shipment_date).toLocaleDateString("vi-VN")}
                    </p>
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
