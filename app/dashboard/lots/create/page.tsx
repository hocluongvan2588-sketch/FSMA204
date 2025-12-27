"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function CreateLotPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedFacility, setSelectedFacility] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, product_name, product_code")
        .order("product_name")
      setProducts(productsData || [])

      // Fetch facilities
      const { data: facilitiesData } = await supabase.from("facilities").select("id, name, location_code").order("name")
      setFacilities(facilitiesData || [])
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    let formData: FormData
    try {
      formData = new FormData(e.currentTarget)
    } catch (err) {
      console.error("[v0] FormData construction error:", err)
      setError("Lỗi khi xử lý form. Vui lòng thử lại.")
      setIsLoading(false)
      return
    }

    const data = {
      tlc: formData.get("tlc") as string,
      product_id: selectedProduct,
      facility_id: selectedFacility,
      batch_number: formData.get("batch_number") as string,
      production_date: formData.get("production_date") as string,
      expiry_date: (formData.get("expiry_date") as string) || null,
      quantity: Number.parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      status: "active",
    }

    try {
      const { error: insertError } = await supabase.from("traceability_lots").insert(data)

      if (insertError) throw insertError

      router.push("/dashboard/lots")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo mã TLC mới</h1>
        <p className="text-slate-500 mt-1">Traceability Lot Code cho lô hàng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin lô hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="tlc">
                  Mã TLC <span className="text-red-500">*</span>
                </Label>
                <Input id="tlc" name="tlc" required placeholder="TLC-2024-001" className="font-mono" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">
                    Sản phẩm <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.product_name} ({product.product_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility_id">
                    Cơ sở <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedFacility} onValueChange={setSelectedFacility} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cơ sở" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name} ({facility.location_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_number">
                  Số lô <span className="text-red-500">*</span>
                </Label>
                <Input id="batch_number" name="batch_number" required placeholder="BATCH-2024-001" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production_date">
                    Ngày sản xuất <span className="text-red-500">*</span>
                  </Label>
                  <Input id="production_date" name="production_date" type="date" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Ngày hết hạn</Label>
                  <Input id="expiry_date" name="expiry_date" type="date" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Số lượng <span className="text-red-500">*</span>
                  </Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" required placeholder="100.00" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">
                    Đơn vị <span className="text-red-500">*</span>
                  </Label>
                  <Input id="unit" name="unit" required placeholder="kg, lbs, units" />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo mã TLC"}
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
