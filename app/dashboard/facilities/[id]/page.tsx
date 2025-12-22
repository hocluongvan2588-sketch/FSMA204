import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: facility, error } = await supabase.from("facilities").select("*, companies(name)").eq("id", id).single()

  if (error || !facility) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{facility.name}</h1>
          <p className="text-slate-500 mt-1">Chi tiết cơ sở sản xuất</p>
        </div>
        <Badge
          variant={
            facility.certification_status === "certified"
              ? "default"
              : facility.certification_status === "pending"
                ? "secondary"
                : "outline"
          }
          className="text-sm px-3 py-1"
        >
          {facility.certification_status === "certified"
            ? "Đã chứng nhận"
            : facility.certification_status === "pending"
              ? "Đang xử lý"
              : "Hết hạn"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Mã cơ sở</p>
              <p className="text-base font-medium mt-1">{facility.location_code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Loại cơ sở</p>
              <p className="text-base font-medium mt-1 capitalize">{facility.facility_type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Công ty</p>
              <p className="text-base font-medium mt-1">{facility.companies?.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngày tạo</p>
              <p className="text-base font-medium mt-1">{new Date(facility.created_at).toLocaleDateString("vi-VN")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vị trí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Địa chỉ</p>
              <p className="text-base mt-1">{facility.address}</p>
            </div>
            {facility.gps_coordinates && (
              <div>
                <p className="text-sm text-slate-500">Tọa độ GPS</p>
                <p className="text-base font-mono mt-1">{facility.gps_coordinates}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/facilities">Quay lại danh sách</Link>
        </Button>
      </div>
    </div>
  )
}
