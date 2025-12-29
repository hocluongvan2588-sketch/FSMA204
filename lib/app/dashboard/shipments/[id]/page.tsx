import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: shipment, error } = await supabase
    .from("shipments")
    .select(
      "*, traceability_lots(tlc, batch_number, products(product_name, product_code)), facilities!shipments_from_facility_id_fkey(name, location_code), to_facility:facilities!shipments_to_facility_id_fkey(name, location_code)",
    )
    .eq("id", id)
    .single()

  if (error || !shipment) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{shipment.shipment_number}</h1>
          <p className="text-slate-500 mt-1">Chi tiết vận chuyển</p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={
              shipment.status === "delivered"
                ? "default"
                : shipment.status === "in_transit"
                  ? "secondary"
                  : shipment.status === "cancelled"
                    ? "destructive"
                    : "outline"
            }
            className="text-sm px-3 py-1"
          >
            {shipment.status === "delivered"
              ? "Đã giao"
              : shipment.status === "in_transit"
                ? "Đang vận chuyển"
                : shipment.status === "cancelled"
                  ? "Đã hủy"
                  : "Chờ xử lý"}
          </Badge>
          {shipment.temperature_controlled && (
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-100 text-blue-800">
              Kiểm soát nhiệt độ
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin lô hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Mã TLC</p>
              <p className="text-base font-mono font-medium mt-1">{shipment.traceability_lots?.tlc}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Sản phẩm</p>
              <p className="text-base font-medium mt-1">
                {shipment.traceability_lots?.products?.product_name} (
                {shipment.traceability_lots?.products?.product_code})
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Số lô</p>
              <p className="text-base font-medium mt-1">{shipment.traceability_lots?.batch_number}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thời gian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Ngày gửi</p>
              <p className="text-base font-medium mt-1">{new Date(shipment.shipment_date).toLocaleString("vi-VN")}</p>
            </div>
            {shipment.expected_delivery && (
              <div>
                <p className="text-sm text-slate-500">Dự kiến giao</p>
                <p className="text-base font-medium mt-1">
                  {new Date(shipment.expected_delivery).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
            {shipment.actual_delivery && (
              <div>
                <p className="text-sm text-slate-500">Thực tế giao</p>
                <p className="text-base font-medium mt-1">
                  {new Date(shipment.actual_delivery).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Điểm đi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Cơ sở</p>
              <p className="text-base font-medium mt-1">
                {shipment.facilities?.name} ({shipment.facilities?.location_code})
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Điểm đến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shipment.to_facility && (
              <div>
                <p className="text-sm text-slate-500">Cơ sở</p>
                <p className="text-base font-medium mt-1">
                  {shipment.to_facility.name} ({shipment.to_facility.location_code})
                </p>
              </div>
            )}
            {shipment.destination_company && (
              <div>
                <p className="text-sm text-slate-500">Công ty</p>
                <p className="text-base font-medium mt-1">{shipment.destination_company}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Địa chỉ</p>
              <p className="text-base mt-1">{shipment.destination_address}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin vận chuyển</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {shipment.carrier_name && (
            <div>
              <p className="text-sm text-slate-500">Nhà vận chuyển</p>
              <p className="text-base font-medium mt-1">{shipment.carrier_name}</p>
            </div>
          )}
          {shipment.vehicle_id && (
            <div>
              <p className="text-sm text-slate-500">Biển số xe</p>
              <p className="text-base font-medium mt-1">{shipment.vehicle_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/shipments">Quay lại danh sách</Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href={`/dashboard/lots/${shipment.tlc_id}`}>Xem lô hàng</Link>
        </Button>
      </div>
    </div>
  )
}
