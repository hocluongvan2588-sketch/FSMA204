import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TraceabilitySearch } from "@/components/traceability-search"

export default async function TraceabilityPage() {
  const supabase = await createClient()

  const [lotsCount, ctesCount, shipmentsCount, recentSearches] = await Promise.all([
    supabase.from("traceability_lots").select("*", { count: "exact", head: true }),
    supabase.from("critical_tracking_events").select("*", { count: "exact", head: true }),
    supabase.from("shipments").select("*", { count: "exact", head: true }),
    supabase
      .from("traceability_lots")
      .select("*, products(product_name), facilities(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Truy xuất nguồn gốc</h1>
        <p className="text-slate-500 mt-1">Tìm kiếm và theo dõi hành trình của lô hàng</p>
      </div>

      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-lg">Tìm kiếm truy xuất</CardTitle>
        </CardHeader>
        <CardContent>
          <TraceabilitySearch />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng số lô hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{lotsCount.count || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Được theo dõi trong hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sự kiện CTE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{ctesCount.count || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Điểm theo dõi quan trọng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vận chuyển</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{shipmentsCount.count || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Hành trình vận chuyển</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lô hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSearches.data && recentSearches.data.length > 0 ? (
            <div className="space-y-3">
              {recentSearches.data.map((lot: any) => (
                <Link
                  key={lot.id}
                  href={`/dashboard/traceability/${lot.tlc}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-slate-900">{lot.tlc}</p>
                    <p className="text-sm text-slate-600">{lot.products?.product_name}</p>
                    <p className="text-xs text-slate-500">{lot.facilities?.name}</p>
                  </div>
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Chưa có lô hàng nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Tra cứu theo TLC</CardTitle>
                <p className="text-xs text-slate-500">Tìm kiếm bằng mã truy xuất</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Nhập mã TLC để xem toàn bộ hành trình từ nguồn gốc đến đích</p>
            <Button asChild className="w-full">
              <Link href="/dashboard/lots">Danh sách TLC</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-teal-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Xem Timeline</CardTitle>
                <p className="text-xs text-slate-500">Dòng thời gian sự kiện</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Theo dõi các sự kiện CTE theo dòng thời gian trực quan</p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/cte">Xem CTEs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
