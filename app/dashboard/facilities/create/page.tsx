"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createFacility } from "@/app/actions/facilities"

export default function CreateFacilityPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [facilityType, setFacilityType] = useState("")
  const [certificationStatus, setCertificationStatus] = useState("")
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
      name: formData.get("name") as string,
      facility_type: facilityType,
      location_code: formData.get("location_code") as string,
      address: formData.get("address") as string,
      gps_coordinates: formData.get("gps_coordinates") as string,
      certification_status: certificationStatus,
    }

    const result = await createFacility(input)

    if (result.error) {
      setError(result.error)
      toast({
        variant: "destructive",
        title: "❌ Lỗi tạo cơ sở",
        description: result.error,
      })
      setIsLoading(false)
      return
    }

    toast({
      title: "✅ Tạo cơ sở thành công!",
      description: `Đã thêm cơ sở "${input.name}" (${input.location_code}) vào hệ thống`,
    })

    router.push("/dashboard/facilities")
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo cơ sở mới</h1>
        <p className="text-slate-500 mt-1">Thêm cơ sở sản xuất hoặc chế biến</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ sở</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên cơ sở <span className="text-red-500">*</span>
                </Label>
                <Input id="name" name="name" required placeholder="Cơ sở chế biến số 1" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facility_type">
                    Loại cơ sở <span className="text-red-500">*</span>
                  </Label>
                  <Select value={facilityType} onValueChange={setFacilityType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại cơ sở" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Sản xuất</SelectItem>
                      <SelectItem value="processing">Chế biến</SelectItem>
                      <SelectItem value="storage">Kho lưu trữ</SelectItem>
                      <SelectItem value="distribution">Phân phối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_code">
                    Mã cơ sở <span className="text-red-500">*</span>
                  </Label>
                  <Input id="location_code" name="location_code" required placeholder="FAC-001" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Địa chỉ <span className="text-red-500">*</span>
                </Label>
                <Textarea id="address" name="address" required placeholder="456 Đường XYZ, Quận 5, TP.HCM" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_coordinates">Tọa độ GPS</Label>
                <Input id="gps_coordinates" name="gps_coordinates" placeholder="10.762622, 106.660172" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certification_status">
                  Trạng thái chứng nhận <span className="text-red-500">*</span>
                </Label>
                <Select value={certificationStatus} onValueChange={setCertificationStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certified">Đã chứng nhận</SelectItem>
                    <SelectItem value="pending">Đang xử lý</SelectItem>
                    <SelectItem value="expired">Hết hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo cơ sở"}
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
