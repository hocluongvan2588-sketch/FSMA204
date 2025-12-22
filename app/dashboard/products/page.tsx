import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*, companies(name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm</h1>
          <p className="text-slate-500 mt-1">Danh sách sản phẩm và Food Traceability List (FTL)</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/create">Thêm sản phẩm</Link>
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-slate-500 mb-6">Thêm sản phẩm đầu tiên vào hệ thống</p>
            <Button asChild>
              <Link href="/dashboard/products/create">Tạo sản phẩm mới</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{product.product_name}</CardTitle>
                  {product.is_ftl && (
                    <Badge variant="default" className="shrink-0">
                      FTL
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Mã sản phẩm</p>
                  <p className="text-sm font-medium mt-1">{product.product_code}</p>
                </div>
                {product.product_name_vi && (
                  <div>
                    <p className="text-xs text-slate-500">Tên tiếng Việt</p>
                    <p className="text-sm font-medium mt-1">{product.product_name_vi}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Danh mục</p>
                  <p className="text-sm font-medium mt-1 capitalize">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Đơn vị</p>
                  <p className="text-sm font-medium mt-1">{product.unit_of_measure}</p>
                </div>
                {product.description && (
                  <div>
                    <p className="text-xs text-slate-500">Mô tả</p>
                    <p className="text-sm text-slate-700 line-clamp-2 mt-1">{product.description}</p>
                  </div>
                )}
                <Button asChild variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  <Link href={`/dashboard/products/${product.id}`}>Xem chi tiết</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
