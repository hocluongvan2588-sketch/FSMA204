import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function CTEPage() {
  const supabase = await createClient()

  const { data: ctes } = await supabase
    .from("critical_tracking_events")
    .select("*, traceability_lots(tlc, products(product_name)), facilities(name)")
    .order("event_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Critical Tracking Events</h1>
          <p className="text-slate-500 mt-1">Theo dõi các sự kiện quan trọng trong chuỗi cung ứng</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cte/create">Thêm sự kiện</Link>
        </Button>
      </div>

      {!ctes || ctes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có sự kiện CTE nào</h3>
            <p className="text-slate-500 mb-6">Tạo sự kiện theo dõi đầu tiên</p>
            <Button asChild>
              <Link href="/dashboard/cte/create">Tạo sự kiện CTE</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ctes.map((cte) => (
            <Card key={cte.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="default" className="capitalize">
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
                      <p className="text-sm text-slate-500">{new Date(cte.event_date).toLocaleString("vi-VN")}</p>
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-2">
                      TLC: {cte.traceability_lots?.tlc} - {cte.traceability_lots?.products?.product_name}
                    </h3>

                    {cte.description && <p className="text-sm text-slate-700 mb-3">{cte.description}</p>}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Cơ sở</p>
                        <p className="font-medium">{cte.facilities?.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Người phụ trách</p>
                        <p className="font-medium">{cte.responsible_person}</p>
                      </div>
                      {cte.quantity_processed && (
                        <div>
                          <p className="text-slate-500">Số lượng</p>
                          <p className="font-medium">
                            {cte.quantity_processed} {cte.unit}
                          </p>
                        </div>
                      )}
                      {cte.temperature && (
                        <div>
                          <p className="text-slate-500">Nhiệt độ</p>
                          <p className="font-medium">{cte.temperature}°C</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button asChild size="sm" variant="outline" className="shrink-0 bg-transparent">
                    <Link href={`/dashboard/cte/${cte.id}`}>Chi tiết</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
