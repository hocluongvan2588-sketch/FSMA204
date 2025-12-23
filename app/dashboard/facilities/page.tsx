import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FacilitiesSearchFilter } from "@/components/facilities-search-filter"

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: { search?: string; facility_type?: string; status?: string }
}) {
  const supabase = await createClient()
  const { search, facility_type, status } = searchParams

  let query = supabase.from("facilities").select("*, companies(name)")

  if (search) {
    query = query.or(`name.ilike.%${search}%,location_code.ilike.%${search}%,address.ilike.%${search}%`)
  }

  if (facility_type) {
    query = query.eq("facility_type", facility_type)
  }

  if (status) {
    query = query.eq("certification_status", status)
  }

  const { data: facilities } = await query.order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý cơ sở</h1>
          <p className="text-slate-500 mt-1">Danh sách các cơ sở sản xuất và chế biến</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/facilities/create">Thêm cơ sở</Link>
        </Button>
      </div>

      <FacilitiesSearchFilter />

      {!facilities || facilities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {search || facility_type || status ? "Không tìm thấy kết quả" : "Chưa có cơ sở nào"}
            </h3>
            <p className="text-slate-500 mb-6">
              {search || facility_type || status
                ? "Thử thay đổi bộ lọc của bạn"
                : "Hãy tạo cơ sở đầu tiên để bắt đầu theo dõi sản xuất"}
            </p>
            <Button asChild>
              <Link href="/dashboard/facilities/create">Tạo cơ sở mới</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{facility.name}</CardTitle>
                  <Badge
                    variant={
                      facility.certification_status === "certified"
                        ? "default"
                        : facility.certification_status === "pending"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {facility.certification_status === "certified"
                      ? "Đã chứng nhận"
                      : facility.certification_status === "pending"
                        ? "Đang xử lý"
                        : "Hết hạn"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Mã cơ sở</p>
                  <p className="text-sm font-medium">{facility.location_code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Loại</p>
                  <p className="text-sm font-medium capitalize">{facility.facility_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Địa chỉ</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{facility.address}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  <Link href={`/dashboard/facilities/${facility.id}`}>Xem chi tiết</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
