import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FSMAExportButtons } from "@/components/fsma-export-buttons"

export default async function GenerateReportPage() {
  const supabase = await createClient()

  // Get stats for reports
  const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

  const { count: lotsCount } = await supabase.from("traceability_lots").select("*", { count: "exact", head: true })

  const { count: cteCount } = await supabase
    .from("critical_tracking_events")
    .select("*", { count: "exact", head: true })

  const { count: shipmentsCount } = await supabase.from("shipments").select("*", { count: "exact", head: true })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo báo cáo FSMA 204</h1>
        <p className="text-slate-500 mt-1">Xuất báo cáo tuân thủ và truy xuất nguồn gốc</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{productsCount || 0}</div>
              <p className="text-sm text-slate-500 mt-1">Sản phẩm</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">{lotsCount || 0}</div>
              <p className="text-sm text-slate-500 mt-1">Mã TLC</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{cteCount || 0}</div>
              <p className="text-sm text-slate-500 mt-1">Sự kiện CTE</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{shipmentsCount || 0}</div>
              <p className="text-sm text-slate-500 mt-1">Vận chuyển</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              Báo cáo sản phẩm FTL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Danh sách đầy đủ các sản phẩm thuộc Food Traceability List theo quy định FDA
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              Tạo báo cáo
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              Báo cáo truy xuất TLC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Lịch sử đầy đủ của các mã TLC và sự kiện liên quan</p>
            <Button variant="outline" className="w-full bg-transparent">
              Tạo báo cáo
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              Báo cáo CTE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Xuất tất cả Critical Tracking Events với đầy đủ KDE theo quy định FSMA 204. Hỗ trợ streaming cho 10k+
              dòng.
            </p>
            <FSMAExportButtons />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Báo cáo tuân thủ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Tình trạng tuân thủ FSMA 204 của toàn bộ hệ thống</p>
            <Button variant="outline" className="w-full bg-transparent">
              Tạo báo cáo
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/dashboard/reports">Quay lại</Link>
        </Button>
      </div>
    </div>
  )
}
