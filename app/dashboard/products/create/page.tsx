"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createProduct } from "@/app/actions/products"

export default function CreateProductPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [category, setCategory] = useState("")
  const [isFTL, setIsFTL] = useState(false)
  const [requiresCTE, setRequiresCTE] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const getCompanyId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
        setCompanyId(profile?.company_id || null)
      }
    }
    getCompanyId()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const input = {
      product_code: formData.get("product_code") as string,
      product_name: formData.get("product_name") as string,
      product_name_vi: formData.get("product_name_vi") as string,
      description: formData.get("description") as string,
      category: category,
      is_ftl: isFTL,
      unit_of_measure: formData.get("unit_of_measure") as string,
      requires_cte: requiresCTE,
    }

    const result = await createProduct(input)

    if (result.error) {
      setError(result.error)
      toast({
        variant: "destructive",
        title: "❌ Lỗi tạo sản phẩm",
        description: result.error,
      })
      setIsLoading(false)
      return
    }

    const ftlIndicator = isFTL ? " (FTL)" : ""
    toast({
      title: "✅ Tạo sản phẩm thành công!",
      description: `Đã thêm sản phẩm "${input.product_name}"${ftlIndicator} với mã ${input.product_code}`,
    })

    router.push("/dashboard/products")
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo sản phẩm mới</h1>
        <p className="text-slate-500 mt-1">Thêm sản phẩm vào hệ thống truy xuất nguồn gốc</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_code">
                  Mã sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Input id="product_code" name="product_code" required placeholder="PRD-SHRIMP-001" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">
                    Tên sản phẩm (EN) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="product_name" name="product_name" required placeholder="Fresh Shrimp" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_name_vi">Tên sản phẩm (VI)</Label>
                  <Input id="product_name_vi" name="product_name_vi" placeholder="Tôm tươi" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" name="description" placeholder="Mô tả chi tiết về sản phẩm" rows={3} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Danh mục <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seafood">Hải sản</SelectItem>
                      <SelectItem value="produce">Nông sản</SelectItem>
                      <SelectItem value="dairy">Sữa & Chế phẩm</SelectItem>
                      <SelectItem value="meat">Thịt</SelectItem>
                      <SelectItem value="processed">Chế biến</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">
                    Đơn vị đo <span className="text-red-500">*</span>
                  </Label>
                  <Input id="unit_of_measure" name="unit_of_measure" required placeholder="kg, lbs, units" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="is_ftl" checked={isFTL} onCheckedChange={(checked) => setIsFTL(checked === true)} />
                  <Label htmlFor="is_ftl" className="text-sm font-normal cursor-pointer">
                    Sản phẩm thuộc Food Traceability List (FTL)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires_cte"
                    checked={requiresCTE}
                    onCheckedChange={(checked) => setRequiresCTE(checked === true)}
                  />
                  <Label htmlFor="requires_cte" className="text-sm font-normal cursor-pointer">
                    Yêu cầu theo dõi Critical Tracking Events (CTE)
                  </Label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo sản phẩm"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
