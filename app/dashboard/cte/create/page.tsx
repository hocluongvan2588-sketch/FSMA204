"use client"

import type React from "react"
import { AlertCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { getAllowedCTETypes } from "@/lib/utils/cte-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function CreateCTEPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lots, setLots] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [selectedLot, setSelectedLot] = useState("")
  const [selectedFacility, setSelectedFacility] = useState("")
  const [eventType, setEventType] = useState("")
  const [organizationType, setOrganizationType] = useState<string | null>(null)
  const [allowedCTEs, setAllowedCTEs] = useState<any[]>([])
  const [kdeFields, setKdeFields] = useState<any[]>([])
  const [kdeValues, setKdeValues] = useState<Record<string, string>>({})
  const [sequenceValidation, setSequenceValidation] = useState<any>(null)
  const [canSubmit, setCanSubmit] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("organization_type").eq("id", user.id).single()

        if (profile) {
          setOrganizationType(profile.organization_type)
          const allowed = getAllowedCTETypes(profile.organization_type)
          setAllowedCTEs(allowed)
        }
      }

      const { data: lotsData } = await supabase
        .from("traceability_lots")
        .select("id, tlc, products(product_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
      setLots(lotsData || [])

      const { data: facilitiesData } = await supabase.from("facilities").select("id, name, location_code").order("name")
      setFacilities(facilitiesData || [])

      const lotParam = searchParams.get("lot")
      if (lotParam) {
        setSelectedLot(lotParam)
      }

      const facilityParam = searchParams.get("facility")
      if (facilityParam) {
        setSelectedFacility(facilityParam)
      }
    }
    fetchData()
  }, [searchParams])

  useEffect(() => {
    const fetchKDERequirements = async () => {
      if (!eventType) return

      const { data, error } = await supabase.rpc("get_missing_kdes", {
        p_event_type: eventType,
        p_facility_id: selectedFacility || null,
      })

      if (data && !error) {
        setKdeFields(data)
        // Check if all critical fields are filled
        const criticalFields = data.filter((f: any) => f.is_critical)
        const allCriticalFilled = criticalFields.every((f: any) => kdeValues[f.kde_key])
        setCanSubmit(allCriticalFilled)
      }
    }

    fetchKDERequirements()
  }, [eventType, selectedFacility])

  useEffect(() => {
    const autoFillLocation = async () => {
      if (selectedFacility) {
        const { data: facility } = await supabase
          .from("facilities")
          .select("location_code, gps_latitude, gps_longitude")
          .eq("id", selectedFacility)
          .single()

        if (facility?.location_code) {
          setKdeValues((prev) => ({
            ...prev,
            location_code: facility.location_code,
          }))
        }
      }
    }

    autoFillLocation()
  }, [selectedFacility])

  useEffect(() => {
    const validateSequence = async () => {
      if (!selectedLot || !eventType) return

      const { data, error } = await supabase.rpc("check_tlc_sequence", {
        p_tlc_id: selectedLot,
        p_event_type: eventType,
        p_event_date: new Date().toISOString(),
      })

      if (data) {
        setSequenceValidation(data)
        if (!data.valid && data.error_code === "SEQUENCE_ERROR") {
          setCanSubmit(false)
        }
      }
    }

    validateSequence()
  }, [selectedLot, eventType])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // Validate 4 decimal places
          const lat = Number(latitude.toFixed(4))
          const lon = Number(longitude.toFixed(4))
          setCurrentLocation({ latitude: lat, longitude: lon })
          setKdeValues((prev) => ({
            ...prev,
            gps_latitude: lat.toString(),
            gps_longitude: lon.toString(),
          }))
        },
        (error) => {
          console.error("[v0] GPS Error:", error)
          setError("Không thể lấy vị trí GPS. Vui lòng kiểm tra quyền truy cập.")
        },
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const criticalFields = kdeFields.filter((f) => f.is_critical)
    const missingCritical = criticalFields.filter((f) => !kdeValues[f.kde_key])

    if (missingCritical.length > 0) {
      setError(`Thiếu thông tin bắt buộc: ${missingCritical.map((f) => f.kde_label).join(", ")}`)
      setIsLoading(false)
      return
    }

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
      // Insert CTE
      const { data: cteData, error: insertError } = await supabase
        .from("critical_tracking_events")
        .insert(data)
        .select()
        .single()

      if (insertError) throw insertError

      if (cteData) {
        const kdeInserts = Object.entries(kdeValues).map(([key, value]) => ({
          cte_id: cteData.id,
          key_name: key,
          key_value: value,
        }))

        if (kdeInserts.length > 0) {
          const { error: kdeError } = await supabase.from("key_data_elements").insert(kdeInserts)

          if (kdeError) console.error("[v0] KDE insert error:", kdeError)
        }
      }

      const facilityParam = searchParams.get("facility")
      const lotParam = searchParams.get("lot")

      if (facilityParam) {
        router.push(`/dashboard/facilities/${facilityParam}`)
      } else if (lotParam) {
        router.push(`/dashboard/lots/${lotParam}`)
      } else {
        router.push("/dashboard/cte")
      }
      router.refresh()
    } catch (err: any) {
      if (err.message.includes("FSMA 204 VIOLATION")) {
        setError(`❌ ${err.message}`)
      } else if (err.message.includes("SEQUENCE VIOLATION")) {
        setError(`🔗 ${err.message}`)
      } else if (err.message.includes("TLC STATUS VIOLATION")) {
        setError(`⛔ ${err.message}`)
      } else {
        setError(err.message || "Đã xảy ra lỗi")
      }
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

      {organizationType && allowedCTEs.length < 7 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-start gap-2">
            <span className="flex-1">
              Tổ chức của bạn (<strong>{organizationType}</strong>) chỉ được phép tạo {allowedCTEs.length} loại CTE theo
              quy định FSMA 204:
              <span className="ml-1 text-emerald-700 font-medium">{allowedCTEs.map((c) => c.label).join(", ")}</span>
            </span>
          </AlertDescription>
        </Alert>
      )}

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

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_type">
                    Loại sự kiện <span className="text-red-500">*</span>
                  </Label>
                  <Select value={eventType} onValueChange={setEventType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedCTEs.length > 0 ? (
                        allowedCTEs.map((cte) => (
                          <SelectItem key={cte.value} value={cte.value}>
                            {cte.label}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="harvest">Thu hoạch</SelectItem>
                          <SelectItem value="cooling">Làm lạnh</SelectItem>
                          <SelectItem value="packing">Đóng gói</SelectItem>
                          <SelectItem value="receiving">Tiếp nhận</SelectItem>
                          <SelectItem value="transformation">Chế biến</SelectItem>
                          <SelectItem value="shipping">Vận chuyển</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {eventType && allowedCTEs.find((c) => c.value === eventType) && (
                    <p className="text-xs text-muted-foreground">
                      {allowedCTEs.find((c) => c.value === eventType)?.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">
                    Thời gian sự kiện <span className="text-red-500">*</span>
                  </Label>
                  <Input id="event_date" name="event_date" type="datetime-local" required />
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

            {sequenceValidation && !sequenceValidation.valid && (
              <Alert variant={sequenceValidation.error_code === "SEQUENCE_ERROR" ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{sequenceValidation.error || sequenceValidation.warning}</strong>
                  {sequenceValidation.suggestion && <p className="mt-1 text-sm">💡 {sequenceValidation.suggestion}</p>}
                </AlertDescription>
              </Alert>
            )}

            {kdeFields.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Thông tin bổ sung (FSMA 204 KDE)</h3>

                {kdeFields.map((field) => (
                  <div key={field.kde_key} className="space-y-2">
                    <Label htmlFor={field.kde_key}>
                      {field.kde_label}
                      {field.is_critical && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {field.kde_key === "gps_latitude" || field.kde_key === "gps_longitude" ? (
                      <div className="flex gap-2">
                        <Input
                          id={field.kde_key}
                          value={kdeValues[field.kde_key] || ""}
                          onChange={(e) => setKdeValues((prev) => ({ ...prev, [field.kde_key]: e.target.value }))}
                          placeholder={field.help_text}
                          required={field.is_critical}
                          type="number"
                          step="0.0001"
                        />
                        {field.kde_key === "gps_latitude" && (
                          <Button type="button" onClick={getCurrentLocation} variant="outline">
                            📍 Lấy GPS
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Input
                        id={field.kde_key}
                        value={kdeValues[field.kde_key] || ""}
                        onChange={(e) => setKdeValues((prev) => ({ ...prev, [field.kde_key]: e.target.value }))}
                        placeholder={field.help_text}
                        required={field.is_critical}
                      />
                    )}

                    {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm whitespace-pre-wrap">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading || !canSubmit}>
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
