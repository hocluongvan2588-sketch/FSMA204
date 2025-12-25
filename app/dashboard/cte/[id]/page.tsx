import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CTEDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: cte, error } = await supabase
    .from("critical_tracking_events")
    .select(
      "*, traceability_lots(tlc, batch_number, products(product_name, product_code)), facilities(name, location_code)",
    )
    .eq("id", id)
    .single()

  if (error || !cte) {
    notFound()
  }

  // Get KDEs for this CTE
  const { data: kdes } = await supabase.from("key_data_elements").select("*").eq("cte_id", id).order("created_at")

  // Get audit history for this CTE
  const { data: auditHistory } = await supabase.rpc("get_record_audit_history", {
    p_table_name: "critical_tracking_events",
    p_record_id: id,
    p_limit: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 capitalize">
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
          </h1>
          <p className="text-slate-500 mt-1">{new Date(cte.event_date).toLocaleString("vi-VN")}</p>
        </div>
        <Badge variant="default" className="capitalize">
          {cte.event_type}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sự kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Mã TLC</p>
              <p className="text-base font-mono font-medium mt-1">{cte.traceability_lots?.tlc}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Sản phẩm</p>
              <p className="text-base font-medium mt-1">
                {cte.traceability_lots?.products?.product_name} ({cte.traceability_lots?.products?.product_code})
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Cơ sở</p>
              <p className="text-base font-medium mt-1">
                {cte.facilities?.name} ({cte.facilities?.location_code})
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Người phụ trách</p>
              <p className="text-base font-medium mt-1">{cte.responsible_person}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiết xử lý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cte.quantity_processed && (
              <div>
                <p className="text-sm text-slate-500">Số lượng xử lý</p>
                <p className="text-base font-medium mt-1">
                  {cte.quantity_processed} {cte.unit}
                </p>
              </div>
            )}
            {cte.temperature !== null && (
              <div>
                <p className="text-sm text-slate-500">Nhiệt độ</p>
                <p className="text-base font-medium mt-1">{cte.temperature}°C</p>
              </div>
            )}
            {cte.location_details && (
              <div>
                <p className="text-sm text-slate-500">Vị trí</p>
                <p className="text-base font-medium mt-1">{cte.location_details}</p>
              </div>
            )}
            {cte.description && (
              <div>
                <p className="text-sm text-slate-500">Mô tả</p>
                <p className="text-base mt-1">{cte.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Data Elements (KDE)</CardTitle>
        </CardHeader>
        <CardContent>
          {!kdes || kdes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Chưa có dữ liệu KDE cho sự kiện này</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {kdes.map((kde) => (
                <div key={kde.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500 capitalize">{kde.kde_type}</p>
                    {kde.is_required && (
                      <Badge variant="secondary" className="text-xs">
                        Bắt buộc
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-1">{kde.key_name}</p>
                  <p className="font-medium text-slate-900">
                    {kde.key_value} {kde.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thay đổi</CardTitle>
        </CardHeader>
        <CardContent>
          {!auditHistory || auditHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Chưa có lịch sử thay đổi cho sự kiện này</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditHistory.map((audit: any) => (
                <div key={audit.id} className="border-l-2 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={audit.operation === "INSERT" ? "default" : "secondary"}>{audit.operation}</Badge>
                    <span className="text-sm text-slate-600">{audit.user_email}</span>
                  </div>
                  {audit.changed_fields && audit.changed_fields.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Thay đổi: <span className="font-mono">{audit.changed_fields.join(", ")}</span>
                    </p>
                  )}
                  {audit.compliance_reason && (
                    <p className="text-xs text-slate-600 mt-1 italic">Lý do: {audit.compliance_reason}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{new Date(audit.created_at).toLocaleString("vi-VN")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/cte">Quay lại danh sách</Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href={`/dashboard/lots/${cte.tlc_id}`}>Xem lô hàng</Link>
        </Button>
      </div>
    </div>
  )
}
