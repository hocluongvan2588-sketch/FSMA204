"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function CreateCTEPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lots, setLots] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [selectedLot, setSelectedLot] = useState("")
  const [selectedFacility, setSelectedFacility] = useState("")
  const [eventType, setEventType] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch traceability lots
      const { data: lotsData } = await supabase
        .from("traceability_lots")
        .select("id, tlc, products(product_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
      setLots(lotsData || [])

      // Fetch facilities
      const { data: facilitiesData } = await supabase.from("facilities").select("id, name, location_code").order("name")
      setFacilities(facilitiesData || [])

      // Pre-select lot from query params
      const lotParam = searchParams.get("lot")
      if (lotParam) {
        setSelectedLot(lotParam)
      }
    }
    fetchData()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      tlc_id: selectedLot,
      event_type: eventType,
      event_date: formData.get("event_date") as string,
      facility_id: selectedFacility,
      responsible_person: formData.get("responsible_person") as string,
      description: formData.get("description") as string,
      temperature: formData.get("temperature") ? Number.parseFloat(formData.get("temperature") as string) : null,
      quantity_processed: formData.get("quantity_processed")
        ? Number.parseFloat(formData.get("quantity_processed") as string)
        : null,
      unit: formData.get("unit") as string,
      location_details: formData.get("location_details") as string,
    }

    try {
      const { error: insertError } = await supabase.from("critical_tracking_events").insert(data)

      if (insertError) throw insertError

      // If coming from lot detail page, go back there
      const lotParam = searchParams.get("lot")
      if (lotParam) {
        router.push(`/dashboard/lots/${lotParam}`)
      } else {
        router.push("/dashboard/cte")
      }
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
        <h1 className="text-3xl font-bold text-slate-900">Tạo sự kiện CTE</h1>
        <p className="text-slate-500 mt-1">Critical Tracking Event - Sự kiện theo dõi quan trọng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="tlc_id">
                  Mã TLC <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedLot} onValueChange={setSelectedLot} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mã TLC" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.tlc} - {lot.products?.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_type">
                    Loại sự kiện <span className="text-red-500">*</span>
                  </Label>
                  <Select value={eventType} onValueChange={setEventType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harvest">Thu hoạch</SelectItem>
                      <SelectItem value="cooling">Làm lạnh</SelectItem>
                      <SelectItem value="packing">Đóng gói</SelectItem>
                      <SelectItem value="receiving">Tiếp nhận</SelectItem>
                      <SelectItem value="transformation">Chế biến</SelectItem>
                      <SelectItem value="shipping">Vận chuyển</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">
                    Thời gian sự kiện <span className="text-red-500">*</span>
                  </Label>
                  <Input id="event_date" name="event_date" type="datetime-local" required />
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="responsible_person">
                  Người phụ trách <span className="text-red-500">*</span>
                </Label>
                <Input id="responsible_person" name="responsible_person" required placeholder="Nguyễn Văn A" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" name="description" placeholder="Mô tả chi tiết về sự kiện" rows={3} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity_processed">Số lượng xử lý</Label>
                  <Input
                    id="quantity_processed"
                    name="quantity_processed"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Đơn vị</Label>
                  <Input id="unit" name="unit" placeholder="kg, lbs, units" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Nhiệt độ (°C)</Label>
                  <Input id="temperature" name="temperature" type="number" step="0.1" placeholder="4.0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_details">Chi tiết vị trí</Label>
                  <Input id="location_details" name="location_details" placeholder="Kho A, Tầng 2" />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo sự kiện"}
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
