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

export default function CreateShipmentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lots, setLots] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [selectedLot, setSelectedLot] = useState("")
  const [selectedFromFacility, setSelectedFromFacility] = useState("")
  const [selectedToFacility, setSelectedToFacility] = useState("")
  const [temperatureControlled, setTemperatureControlled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active traceability lots
      const { data: lotsData } = await supabase
        .from("traceability_lots")
        .select("id, tlc, products(product_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
      setLots(lotsData || [])

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

    const formData = new FormData(e.currentTarget)
    const data = {
      shipment_number: formData.get("shipment_number") as string,
      tlc_id: selectedLot,
      from_facility_id: selectedFromFacility,
      to_facility_id: selectedToFacility || null,
      destination_address: formData.get("destination_address") as string,
      destination_company: formData.get("destination_company") as string,
      shipment_date: formData.get("shipment_date") as string,
      expected_delivery: (formData.get("expected_delivery") as string) || null,
      carrier_name: formData.get("carrier_name") as string,
      vehicle_id: formData.get("vehicle_id") as string,
      temperature_controlled: temperatureControlled,
      status: "pending",
    }

    try {
      const { error: insertError } = await supabase.from("shipments").insert(data)

      if (insertError) throw insertError

      router.push("/dashboard/shipments")
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
        <h1 className="text-3xl font-bold text-slate-900">Tạo vận chuyển mới</h1>
        <p className="text-slate-500 mt-1">Ghi nhận thông tin vận chuyển lô hàng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin vận chuyển</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment_number">
                  Số vận chuyển <span className="text-red-500">*</span>
                </Label>
                <Input id="shipment_number" name="shipment_number" required placeholder="SHIP-2024-001" />
              </div>

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
                  <Label htmlFor="from_facility_id">
                    Từ cơ sở <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedFromFacility} onValueChange={setSelectedFromFacility} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cơ sở gửi" />
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
                  <Label htmlFor="to_facility_id">Đến cơ sở</Label>
                  <Select value={selectedToFacility} onValueChange={setSelectedToFacility}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cơ sở nhận (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
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
                <Label htmlFor="destination_company">Công ty đích</Label>
                <Input id="destination_company" name="destination_company" placeholder="ABC Trading Co." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_address">
                  Địa chỉ đích <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="destination_address"
                  name="destination_address"
                  required
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipment_date">
                    Ngày gửi <span className="text-red-500">*</span>
                  </Label>
                  <Input id="shipment_date" name="shipment_date" type="datetime-local" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_delivery">Dự kiến giao</Label>
                  <Input id="expected_delivery" name="expected_delivery" type="datetime-local" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier_name">Nhà vận chuyển</Label>
                  <Input id="carrier_name" name="carrier_name" placeholder="Viettel Post" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Biển số xe</Label>
                  <Input id="vehicle_id" name="vehicle_id" placeholder="51A-12345" />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="temperature_controlled"
                  checked={temperatureControlled}
                  onCheckedChange={(checked) => setTemperatureControlled(checked === true)}
                />
                <Label htmlFor="temperature_controlled" className="text-sm font-normal cursor-pointer">
                  Vận chuyển có kiểm soát nhiệt độ
                </Label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo vận chuyển"}
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
