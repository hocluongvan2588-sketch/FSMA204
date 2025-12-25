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
import { MapPin, Loader2 } from "lucide-react"

export default function CreateFacilityPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [facilityType, setFacilityType] = useState("")
  const [certificationStatus, setCertificationStatus] = useState("")
  const [address, setAddress] = useState("")
  const [gpsCoordinates, setGpsCoordinates] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([])
  const [showSuggestions, setShowSuggestions] = useState(false)
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

  const handleAddressChange = async (value: string) => {
    setAddress(value)

    if (value.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      // Add Vietnam to query for better results
      const searchQuery = value.includes("Vietnam") || value.includes("Việt Nam") ? value : `${value}, Vietnam`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=vn&addressdetails=1`,
      )

      if (response.ok) {
        const data = await response.json()
        setAddressSuggestions(data)
        setShowSuggestions(data.length > 0)
      }
    } catch (error) {
      console.error("[v0] Autocomplete error:", error)
    }
  }

  const handleSelectSuggestion = (suggestion: { display_name: string; lat: string; lon: string }) => {
    setAddress(suggestion.display_name)
    setGpsCoordinates(`${suggestion.lat}, ${suggestion.lon}`)
    setShowSuggestions(false)
    setAddressSuggestions([])
    toast({
      title: "✅ Đã chọn địa chỉ!",
      description: `Tọa độ: ${suggestion.lat}, ${suggestion.lon}`,
    })
  }

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      toast({
        variant: "destructive",
        title: "Vui lòng nhập địa chỉ",
        description: "Địa chỉ không được để trống để lấy tọa độ GPS",
      })
      return
    }

    setIsGeocoding(true)
    try {
      const searchQuery = address.includes("Vietnam") || address.includes("Việt Nam") ? address : `${address}, Vietnam`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=vn`,
      )

      if (!response.ok) {
        throw new Error("Không thể kết nối đến dịch vụ bản đồ")
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setGpsCoordinates(`${lat}, ${lon}`)
        toast({
          title: "✅ Đã lấy tọa độ GPS!",
          description: `Tọa độ: ${lat}, ${lon}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Không tìm thấy địa chỉ",
          description:
            "Vui lòng thử nhập địa chỉ đầy đủ hơn (bao gồm quận/huyện, thành ph���) hoặc nhập tọa độ GPS thủ công",
        })
      }
    } catch (error) {
      console.error("[v0] Geocoding error:", error)
      toast({
        variant: "destructive",
        title: "Lỗi lấy tọa độ GPS",
        description: "Vui lòng nhập tọa độ GPS thủ công",
      })
    } finally {
      setIsGeocoding(false)
    }
  }

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
                <div className="relative">
                  <Textarea
                    id="address"
                    name="address"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    required
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    rows={3}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700">{suggestion.display_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Nhập địa chỉ đầy đủ (số nhà, đường, quận/huyện, thành phố) để nhận gợi ý và tự động lấy tọa độ GPS
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_coordinates">
                  Tọa độ GPS{" "}
                  <span className="text-xs text-slate-500 font-normal">(Tự động từ địa chỉ hoặc nhập thủ công)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="gps_coordinates"
                    name="gps_coordinates"
                    value={gpsCoordinates}
                    onChange={(e) => setGpsCoordinates(e.target.value)}
                    placeholder="10.762622, 106.660172"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding || !address}
                    className="shrink-0 bg-transparent"
                  >
                    {isGeocoding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lấy...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Lấy tọa độ
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Định dạng: Vĩ độ, Kinh độ (ví dụ: 10.762622, 106.660172). Nhấn "Lấy tọa độ" để tự động điền từ địa
                  chỉ.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certification_status">
                  Trạng thái đăng ký FDA <span className="text-red-500">*</span>
                </Label>
                <Select value={certificationStatus} onValueChange={setCertificationStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái đăng ký FDA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certified">Đã đăng ký FDA</SelectItem>
                    <SelectItem value="pending">Đang chờ đăng ký FDA</SelectItem>
                    <SelectItem value="not_required">Chưa cần đăng ký</SelectItem>
                    <SelectItem value="expired">Đăng ký hết hạn</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Trạng thái đăng ký FDA của cơ sở theo quy định FSMA 204. Liên hệ System Admin để đăng ký FDA mới.
                </p>
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
