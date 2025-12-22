import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function LotsPage() {
  const supabase = await createClient()

  const { data: lots } = await supabase
    .from("traceability_lots")
    .select("*, products(product_name, product_code), facilities(name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý mã TLC</h1>
          <p className="text-slate-500 mt-1">Traceability Lot Codes - Theo dõi từng lô hàng</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/lots/create">Tạo mã TLC</Link>
        </Button>
      </div>

      {!lots || lots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có mã TLC nào</h3>
            <p className="text-slate-500 mb-6">Tạo mã truy xuất đầu tiên cho lô hàng của bạn</p>
            <Button asChild>
              <Link href="/dashboard/lots/create">Tạo mã TLC mới</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách mã TLC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {lots.map((lot) => (
                <div key={lot.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-mono font-semibold text-slate-900">{lot.tlc}</p>
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Sản phẩm</p>
                          <p className="font-medium truncate">{lot.products?.product_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cơ sở</p>
                          <p className="font-medium truncate">{lot.facilities?.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Ngày sản xuất</p>
                          <p className="font-medium">{new Date(lot.production_date).toLocaleDateString("vi-VN")}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Số lượng</p>
                          <p className="font-medium">
                            {lot.quantity} {lot.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0 bg-transparent">
                      <Link href={`/dashboard/lots/${lot.id}`}>Chi tiết</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
