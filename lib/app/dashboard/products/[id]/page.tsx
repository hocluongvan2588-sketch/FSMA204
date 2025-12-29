import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: product, error } = await supabase.from("products").select("*, companies(name)").eq("id", id).single()

  if (error || !product) {
    notFound()
  }

  // Get traceability lots for this product
  const { data: lots } = await supabase
    .from("traceability_lots")
    .select("*, facilities(name)")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{product.product_name}</h1>
          <p className="text-slate-500 mt-1">{product.product_name_vi}</p>
        </div>
        <div className="flex gap-2">
          {product.is_ftl && <Badge variant="default">FTL</Badge>}
          {product.requires_cte && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Yêu cầu CTE
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Mã sản phẩm</p>
              <p className="text-base font-medium mt-1">{product.product_code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Danh mục</p>
              <p className="text-base font-medium mt-1 capitalize">{product.category}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Đơn vị đo</p>
              <p className="text-base font-medium mt-1">{product.unit_of_measure}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Công ty</p>
              <p className="text-base font-medium mt-1">{product.companies?.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mô tả</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-slate-700">{product.description || "Chưa có mô tả"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lô hàng gần đây</CardTitle>
          <Button asChild size="sm" variant="outline" className="bg-transparent">
            <Link href={`/dashboard/lots?product=${product.id}`}>Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!lots || lots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Chưa có lô hàng nào cho sản phẩm này</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/lots/create">Tạo lô hàng mới</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {lots.map((lot) => (
                <div key={lot.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{lot.tlc}</p>
                      <p className="text-sm text-slate-500">
                        {lot.facilities?.name} • {new Date(lot.production_date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        lot.status === "active" ? "default" : lot.status === "recalled" ? "destructive" : "secondary"
                      }
                    >
                      {lot.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/products">Quay lại danh sách</Link>
        </Button>
      </div>
    </div>
  )
}
