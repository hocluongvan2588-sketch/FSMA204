import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"
import { TraceabilityTimeline } from "@/components/traceability-timeline"

export default async function TraceabilityDetailPage({ params }: { params: { tlc: string } }) {
  const supabase = await createClient()
  const { tlc } = await params

  const { data: lot } = await supabase
    .from("traceability_lots")
    .select("*, products(product_name, product_code, is_ftl), facilities(name, location_code, address)")
    .eq("tlc", tlc)
    .single()

  if (!lot) {
    notFound()
  }

  const [ctesData, shipmentsData] = await Promise.all([
    supabase
      .from("critical_tracking_events")
      .select("*, facilities(name, location_code, address)")
      .eq("tlc_id", lot.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("shipments")
      .select(
        "*, from_facility:facilities!shipments_from_facility_id_fkey(name, location_code), to_facility:facilities!shipments_to_facility_id_fkey(name, location_code)",
      )
      .eq("tlc_id", lot.id)
      .order("shipment_date", { ascending: true }),
  ])

  const ctes = ctesData.data || []
  const shipments = shipmentsData.data || []

  const timelineEvents = [
    ...ctes.map((cte) => ({
      type: "cte" as const,
      id: cte.id,
      date: new Date(cte.event_date),
      title: cte.event_type,
      description: cte.description,
      facility: cte.facilities?.name,
      location: cte.facilities?.location_code,
      data: cte,
    })),
    ...shipments.map((shipment) => ({
      type: "shipment" as const,
      id: shipment.id,
      date: new Date(shipment.shipment_date),
      title: "Vận chuyển",
      description: `${shipment.from_facility?.name} → ${shipment.to_facility?.name}`,
      facility: shipment.from_facility?.name,
      location: shipment.from_facility?.location_code,
      data: shipment,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 font-mono">{lot.tlc}</h1>
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
            {lot.products?.is_ftl && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                FTL
              </Badge>
            )}
          </div>
          <p className="text-slate-500">{lot.products?.product_name}</p>
          <p className="text-sm text-slate-400">Lô {lot.batch_number}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/traceability">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Sản phẩm</p>
              <p className="text-sm font-medium mt-1">
                {lot.products?.product_name}
                <span className="text-slate-400"> ({lot.products?.product_code})</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cơ sở sản xuất</p>
              <p className="text-sm font-medium mt-1">{lot.facilities?.name}</p>
              <p className="text-xs text-slate-400">{lot.facilities?.location_code}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Số lượng</p>
              <p className="text-sm font-medium mt-1">
                {lot.quantity} {lot.unit}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Thời gian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Ngày sản xuất</p>
              <p className="text-sm font-medium mt-1">{new Date(lot.production_date).toLocaleDateString("vi-VN")}</p>
            </div>
            {lot.expiry_date && (
              <div>
                <p className="text-xs text-slate-500">Ngày hết hạn</p>
                <p className="text-sm font-medium mt-1">{new Date(lot.expiry_date).toLocaleDateString("vi-VN")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">Tạo lúc</p>
              <p className="text-sm font-medium mt-1">
                {new Date(lot.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Sự kiện CTE</p>
              <p className="text-2xl font-bold text-blue-600">{ctes.length}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Vận chuyển</p>
              <p className="text-2xl font-bold text-teal-600">{shipments.length}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Tổng điểm theo dõi</p>
              <p className="text-2xl font-bold text-indigo-600">{ctes.length + shipments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hành trình truy xuất</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="font-medium text-slate-900 mb-1">Chưa có sự kiện nào</p>
              <p className="text-sm text-slate-500 mb-4">Hãy bắt đầu ghi nhận hành trình của lô hàng này</p>
              <Button asChild>
                <Link href={`/dashboard/cte/create?lot=${lot.id}`}>Tạo sự kiện đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <TraceabilityTimeline events={timelineEvents} />
          )}
        </CardContent>
      </Card>

      {ctes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết sự kiện CTE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ctes.map((cte) => (
                <div key={cte.id} className="border rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="secondary" className="capitalize mb-2">
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
                      <p className="font-medium text-slate-900">{cte.facilities?.name}</p>
                      <p className="text-sm text-slate-500">{cte.facilities?.location_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(cte.event_date).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(cte.event_date).toLocaleTimeString("vi-VN")}</p>
                    </div>
                  </div>
                  {cte.description && <p className="text-sm text-slate-700 mb-3">{cte.description}</p>}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Người chịu trách nhiệm</p>
                      <p className="font-medium">{cte.responsible_person || "N/A"}</p>
                    </div>
                    {cte.quantity_processed && (
                      <div>
                        <p className="text-xs text-slate-500">Số lượng xử lý</p>
                        <p className="font-medium">
                          {cte.quantity_processed} {cte.unit}
                        </p>
                      </div>
                    )}
                    {cte.temperature && (
                      <div>
                        <p className="text-xs text-slate-500">Nhiệt độ</p>
                        <p className="font-medium">{cte.temperature}°C</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử vận chuyển</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shipments.map((shipment) => (
                <div key={shipment.id} className="border rounded-lg p-4 hover:border-teal-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-medium text-slate-900 mb-1">{shipment.shipment_number}</p>
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
                    <p className="text-sm text-slate-500">
                      {new Date(shipment.shipment_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Từ</p>
                      <p className="font-medium">{shipment.from_facility?.name}</p>
                      <p className="text-xs text-slate-400">{shipment.from_facility?.location_code}</p>
                    </div>
                    <svg
                      className="h-5 w-5 text-slate-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Đến</p>
                      <p className="font-medium">{shipment.to_facility?.name}</p>
                      <p className="text-xs text-slate-400">{shipment.to_facility?.location_code}</p>
                    </div>
                  </div>
                  {shipment.carrier_name && (
                    <p className="text-sm text-slate-600">Nhà vận chuyển: {shipment.carrier_name}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
