import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function LotDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lot, error } = await supabase
    .from("traceability_lots")
    .select("*, products(product_name, product_code), facilities(name, location_code)")
    .eq("id", id)
    .single()

  if (error || !lot) {
    notFound()
  }

  // Get CTEs for this lot
  const { data: ctes } = await supabase
    .from("critical_tracking_events")
    .select("*, facilities(name)")
    .eq("tlc_id", id)
    .order("event_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-mono">{lot.tlc}</h1>
          <p className="text-slate-500 mt-1">
            {lot.products?.product_name} - Lô {lot.batch_number}
          </p>
        </div>
        <Badge
          variant={
            lot.status === "active"
              ? "default"
              : lot.status === "recalled"
                ? "destructive"
                : lot.status === "expired"
                  ? "outline"
                  : "secondary"
          }
          className="text-sm px-3 py-1"
        >
          {lot.status === "active"
            ? "Hoạt động"
            : lot.status === "recalled"
              ? "Thu hồi"
              : lot.status === "expired"
                ? "Hết hạn"
                : "Đã dùng hết"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin lô hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Mã TLC</p>
              <p className="text-base font-mono font-medium mt-1">{lot.tlc}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Số lô</p>
              <p className="text-base font-medium mt-1">{lot.batch_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Sản phẩm</p>
              <p className="text-base font-medium mt-1">
                {lot.products?.product_name} ({lot.products?.product_code})
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Cơ sở</p>
              <p className="text-base font-medium mt-1">
                {lot.facilities?.name} ({lot.facilities?.location_code})
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin sản xuất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Ngày sản xuất</p>
              <p className="text-base font-medium mt-1">{new Date(lot.production_date).toLocaleDateString("vi-VN")}</p>
            </div>
            {lot.expiry_date && (
              <div>
                <p className="text-sm text-slate-500">Ngày hết hạn</p>
                <p className="text-base font-medium mt-1">{new Date(lot.expiry_date).toLocaleDateString("vi-VN")}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Số lượng</p>
              <p className="text-base font-medium mt-1">
                {lot.quantity} {lot.unit}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngày tạo</p>
              <p className="text-base font-medium mt-1">{new Date(lot.created_at).toLocaleDateString("vi-VN")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Critical Tracking Events (CTE)</CardTitle>
          <Button asChild size="sm">
            <Link href={`/dashboard/cte/create?lot=${lot.id}`}>Thêm sự kiện</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!ctes || ctes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Chưa có sự kiện CTE nào cho lô hàng này</p>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/dashboard/cte/create?lot=${lot.id}`}>Tạo sự kiện đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ctes.map((cte) => (
                <div key={cte.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{cte.event_type}</p>
                      <p className="text-sm text-slate-500">{cte.facilities?.name}</p>
                    </div>
                    <p className="text-sm text-slate-500">{new Date(cte.event_date).toLocaleString("vi-VN")}</p>
                  </div>
                  {cte.description && <p className="text-sm text-slate-700 mt-2">{cte.description}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Người chịu trách nhiệm</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/lots">Quay lại danh sách</Link>
        </Button>
      </div>
    </div>
  )
}
