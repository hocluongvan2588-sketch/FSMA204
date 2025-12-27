"use client"

import type React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { TransformationInputSelector } from "@/components/transformation-input-selector"
import { canCreateTransformation } from "@/lib/utils/fsma-204-validation"
import { checkChronologicalValidity } from "@/lib/utils/chronological-validator"
import { canCreateCTE } from "@/lib/utils/cte-permissions"
import type { CTEType } from "@/lib/utils/cte-permissions"
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
import { getActualEventType } from "@/lib/utils/cte-permissions"
import type { OrganizationType } from "@/lib/utils/cte-permissions"
import { calculateCurrentStock } from "@/lib/utils/calculate-current-stock"
import { convertToBaseUnit } from "@/lib/utils/unit-converter"
import { useToast } from "@/hooks/use-toast"

interface ChronologicalCheckResult {
  valid: boolean
  error?: string
  guidance?: string
  last_event_type?: string
  last_event_type_vi?: string
  last_event_date?: string
  last_event_date_formatted?: string
  attempted_event_type_vi?: string
  attempted_event_date_formatted?: string
  time_difference_seconds?: number
  time_difference_human?: string
  time_since_last_event_seconds?: number
  time_since_last_event_human?: string
  severity?: string
  first_event?: boolean
  message?: string
}

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
  const [transformationInputs, setTransformationInputs] = useState<
    Array<{ tlc_id: string; tlc_code: string; quantity_used: number }>
  >([])
  const [transformationErrors, setTransformationErrors] = useState<string[]>([])
  const [chronologicalCheck, setChronologicalCheck] = useState<ChronologicalCheckResult | null>(null)
  const [quantityError, setQuantityError] = useState<string | null>(null)
  const [quantityInBaseUnit, setQuantityInBaseUnit] = useState<number | null>(null)
  const [unitInfo, setUnitInfo] = useState<string | null>(null)
  const [availableStock, setAvailableStock] = useState<number | null>(null)
  const [stockFetched, setStockFetched] = useState<boolean>(false)
  const [stockLoading, setStockLoading] = useState<boolean>(false)
  const [chronologicalError, setChronologicalError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { toast } = useToast()

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

      const { data: facilitiesData } = await supabase.from("facilities").select("id, name").order("name")
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
    const calculateStock = async () => {
      if (!selectedLot || lots.length === 0) {
        setAvailableStock(null)
        setStockFetched(false)
        return
      }

      const lot = lots.find((l) => l.id === selectedLot)
      if (!lot) {
        setAvailableStock(null)
        setStockFetched(false)
        return
      }

      setStockLoading(true)
      setStockFetched(true)
      try {
        const stock = await calculateCurrentStock(lot.tlc)
        setAvailableStock(stock.current_stock)
      } catch (err) {
        console.error("Error calculating stock:", err)
        setAvailableStock(null)
      } finally {
        setStockLoading(false)
      }
    }
    calculateStock()
  }, [selectedLot, lots])

  useEffect(() => {
    const fetchKDERequirements = async () => {
      if (!eventType) {
        setKdeFields([])
        return
      }

      try {
        const supabase = createClient()
        console.log("[v0] Fetching KDE requirements for event type:", eventType)

        const { data, error } = await supabase.rpc("get_missing_kdes", {
          p_event_type: eventType,
          p_facility_id: selectedFacility || null,
        })

        console.log("[v0] KDE fetch result:", { data, error })

        if (error) {
          console.error("[v0] KDE fetch error:", error)
          const fallbackKdes = getFallbackKdeRequirements(eventType)
          console.log("[v0] Using fallback KDEs:", fallbackKdes)
          setKdeFields(fallbackKdes)
        } else if (data && data.length > 0) {
          setKdeFields(data)
        } else {
          const fallbackKdes = getFallbackKdeRequirements(eventType)
          console.log("[v0] No KDE data, using fallback:", fallbackKdes)
          setKdeFields(fallbackKdes)
        }
      } catch (err) {
        console.error("[v0] KDE fetch error:", err)
        const fallbackKdes = getFallbackKdeRequirements(eventType)
        setKdeFields(fallbackKdes)
      }
    }

    fetchKDERequirements()
  }, [eventType, selectedFacility])

  useEffect(() => {
    const autoFillLocation = async () => {
      if (selectedFacility) {
        const { data: facility } = await supabase
          .from("facilities")
          .select("location_code")
          .eq("id", selectedFacility)
          .single()

        if (facility?.location_code) {
          console.log("[v0] Facility location_code:", facility.location_code)
        }
      }
    }

    autoFillLocation()
  }, [selectedFacility])

  useEffect(() => {
    const validateSequence = async () => {
      if (!selectedLot || !eventType) return

      try {
        setSequenceValidation(null)
      } catch (err) {
        console.log("[v0] Sequence validation error:", err)
        setSequenceValidation(null)
      }
    }

    validateSequence()
  }, [selectedLot, eventType])

  useEffect(() => {
    if (eventType === "transformation") {
      setTransformationInputs([])
      setTransformationErrors([])
    }
  }, [eventType])

  useEffect(() => {
    const validateChronological = async () => {
      if (!selectedLot || !eventType) {
        setChronologicalCheck(null)
        return
      }

      const eventDateInput = document.querySelector('input[name="event_date"]') as HTMLInputElement
      if (!eventDateInput || !eventDateInput.value) return

      const eventDate = new Date(eventDateInput.value)

      const result = await checkChronologicalValidity(selectedLot, eventType, eventDate)

      setChronologicalCheck(result)

      if (!result.valid) {
        setChronologicalError(result.error)
        setCanSubmit(false)
      } else {
        setChronologicalError(null)
      }
    }

    const timer = setTimeout(validateChronological, 500)
    return () => clearTimeout(timer)
  }, [selectedLot, eventType])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
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

  const handleTLCSelect = (tlcId: string) => {
    setSelectedLot(tlcId)
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = e.target.value
    const unit = (document.getElementById("unit") as HTMLInputElement)?.value || "kg"

    if (!quantity || !unit) {
      setQuantityError(null)
      setQuantityInBaseUnit(null)
      setUnitInfo(null)
      return
    }

    try {
      const inBaseUnit = convertToBaseUnit(Number.parseFloat(quantity), unit)
      setQuantityInBaseUnit(inBaseUnit)
      setUnitInfo(`= ${inBaseUnit.toFixed(2)} kg`)

      if (availableStock !== null && inBaseUnit > availableStock) {
        if (eventType === "cooling" || eventType === "packing" || eventType === "shipping") {
          setQuantityError(
            `❌ VƯỢT TỒN KHO! Bạn nhập ${inBaseUnit.toFixed(2)} kg nhưng chỉ có ${availableStock.toFixed(2)} kg khả dụng. Vui lòng giảm số lượng hoặc kiểm tra lại tồn kho.`,
          )
        } else {
          setQuantityError(null)
        }
      } else {
        setQuantityError(null)
      }
    } catch (error) {
      setQuantityError(`❌ ${error instanceof Error ? error.message : "Đơn vị không hợp lệ"}`)
      setQuantityInBaseUnit(null)
      setUnitInfo(null)
    }
  }

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value
    const quantity = (document.getElementById("quantity_processed") as HTMLInputElement)?.value

    if (quantity && unit) {
      handleQuantityChange({ target: { value: quantity } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!e.currentTarget) {
      setError("Form element is missing. Please try again.")
      setIsLoading(false)
      return
    }

    let formData: FormData
    try {
      formData = new FormData(e.currentTarget)
    } catch (err) {
      console.error("[v0] FormData construction error:", err)
      setError("Lỗi khi xử lý form. Vui lòng thử lại.")
      setIsLoading(false)
      return
    }

    if ((eventType === "cooling" || eventType === "packing" || eventType === "shipping") && selectedLot) {
      const lot = lots.find((l) => l.id === selectedLot)
      if (lot) {
        try {
          const stockResult = await calculateCurrentStock(lot.tlc)
          const processedQty = quantityInBaseUnit || 0

          if (processedQty > stockResult.current_stock) {
            setError(
              `❌ THIẾU TỒN KHO: TLC ${lot.tlc}\n\n` +
                `📦 Tồn kho khả dụng: ${stockResult.current_stock.toFixed(2)} kg\n` +
                `   = Sản xuất (${stockResult.total_production.toFixed(2)}) + Tiếp nhận (${stockResult.total_receiving.toFixed(2)}) - Vận chuyển (${stockResult.total_shipping.toFixed(2)})\n\n` +
                `📤 Yêu cầu ${eventType === "cooling" ? "làm lạnh" : eventType === "packing" ? "đóng gói" : "vận chuyển"}: ${processedQty.toFixed(2)} kg\n` +
                `⚠️ Thiếu: ${(processedQty - stockResult.current_stock).toFixed(2)} kg\n\n` +
                `Vui lòng giảm số lượng hoặc chờ thêm sự kiện nhập hàng.`,
            )
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.error("[v0] Error calculating stock for validation:", err)
          setError("Lỗi hệ thống khi kiểm tra tồn kho")
          setIsLoading(false)
          return
        }
      }
    }

    if (organizationType) {
      const { canCreate, error: typeError } = canCreateCTE(organizationType, eventType as CTEType)
      if (!canCreate) {
        setError(
          `❌ FSMA 204 VIOLATION: Tổ chức "${organizationType}" không được phép tạo CTE loại "${eventType}". ` +
            `Các CTE được phép: ${getAllowedCTETypes(organizationType)
              .map((c) => c.label)
              .join(", ")}`,
        )
        setIsLoading(false)
        return
      }
    }

    if (chronologicalCheck && !chronologicalCheck.valid) {
      setError(`⏰ ${chronologicalCheck.error}\n\n${chronologicalCheck.guidance}`)
      setIsLoading(false)
      return
    }

    if (eventType === "transformation") {
      if (transformationInputs.length === 0) {
        setError("❌ Transformation yêu cầu ít nhất 1 mã lô nguồn đầu vào")
        setIsLoading(false)
        return
      }

      const validation = await canCreateTransformation(transformationInputs.map((i) => i.tlc_code))
      if (!validation.canCreate) {
        setError(`❌ FSMA 204 VIOLATION:\n\n${validation.errors.join("\n\n")}`)
        setIsLoading(false)
        return
      }
    }

    if (quantityError) {
      setError(quantityError)
      setIsLoading(false)
      return
    }

    const actualEventType = getActualEventType(eventType as CTEType, organizationType as OrganizationType)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const kdeDataArray = Object.entries(kdeValues)
      .filter(([_, value]) => value && value.trim() !== "")
      .map(([key, value]) => ({
        key_name: key,
        key_value: value,
      }))

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc("create_cte_with_kdes", {
        p_tlc_id: selectedLot,
        p_event_type: actualEventType,
        p_event_date: formData.get("event_date") as string,
        p_facility_id: selectedFacility || null,
        p_responsible_person: formData.get("responsible_person") as string,
        p_description: formData.get("description") as string,
        p_temperature: formData.get("temperature") ? Number.parseFloat(formData.get("temperature") as string) : null,
        p_quantity_processed: quantityInBaseUnit,
        p_quantity_in_base_unit: quantityInBaseUnit,
        p_unit: "kg",
        p_location_details: formData.get("location_details") as string,
        p_submitted_by: user?.id || null,
        p_status: "draft",
        p_is_correction: false,
        p_kde_data: kdeDataArray,
      })

      if (rpcError) {
        throw rpcError
      }

      if (!rpcResult?.success) {
        throw new Error(rpcResult?.error || "Không thể tạo sự kiện CTE")
      }

      const cteId = rpcResult.cte_id

      if (eventType === "transformation" && transformationInputs.length > 0 && cteId) {
        const transformationInserts = transformationInputs.map((input) => ({
          transformation_cte_id: cteId,
          input_tlc_id: input.tlc_id,
          quantity_used: input.quantity_used,
          unit: (formData.get("unit") as string) || "kg",
        }))

        const { error: transformationError } = await supabase
          .from("transformation_inputs")
          .insert(transformationInserts)

        if (transformationError) {
          console.error("[v0] Transformation inputs error:", transformationError)
          throw new Error("Không thể lưu thông tin lô nguồn chế biến")
        }

        for (const input of transformationInputs) {
          const { error: updateError } = await supabase.rpc("update_tlc_quantity_after_transformation", {
            p_tlc_id: input.tlc_id,
            p_quantity_used: input.quantity_used,
          })

          if (updateError) {
            console.error("[v0] TLC quantity update error:", updateError)
          }
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
      console.error("[v0] CTE creation error:", err)

      if (err.message?.includes("FSMA 204 VIOLATION") || err.message?.includes("VI PHẠM FSMA 204")) {
        setError(`❌ ${err.message}`)
      } else if (err.message?.includes("CHRONOLOGICAL VIOLATION") || err.message?.includes("chronological")) {
        setError(`⏰ ${err.message}`)
      } else if (err.message?.includes("INVENTORY") || err.message?.includes("inventory")) {
        setError(`📦 ${err.message}`)
      } else {
        setError(`Lỗi: ${err.message || "Không thể tạo sự kiện CTE"}`)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo Sự Kiện CTE</h1>
        <p className="text-slate-500 mt-1">Theo dõi các sự kiện quan trọng trong chuỗi cung ứng</p>
      </div>

      {error && (
        <Alert variant="destructive" className="whitespace-pre-wrap">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tlc_id">
                  Mã TLC <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedLot} onValueChange={handleTLCSelect} required>
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
              </div>
            </div>

            {selectedLot && stockFetched && (
              <div
                className={`p-3 rounded-lg border ${
                  availableStock !== null && availableStock <= 0
                    ? "bg-red-50 border-red-300"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                {stockLoading ? (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
                    Đang tính toán tồn kho...
                  </div>
                ) : availableStock !== null ? (
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold ${
                        availableStock <= 0
                          ? "text-red-900"
                          : availableStock < 100
                            ? "text-orange-900"
                            : "text-blue-900"
                      }`}
                    >
                      {availableStock <= 0 ? "⚠️" : "📦"} Tồn kho khả dụng: {availableStock.toFixed(2)} kg
                    </p>
                    <p className={`text-xs ${availableStock <= 0 ? "text-red-700" : "text-blue-700"}`}>
                      = Sản xuất + Tiếp nhận - Vận chuyển - Chế biến
                    </p>
                    {availableStock <= 0 && (
                      <p className="text-xs text-red-800 font-semibold mt-2">
                        ⛔ Hết hàng! Không thể tạo sự kiện làm lạnh, đóng gói, hoặc vận chuyển.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-600">Không thể tính tồn kho</p>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">
                  Thời gian sự kiện <span className="text-red-500">*</span>
                </Label>
                <Input id="event_date" name="event_date" type="datetime-local" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility_id">Cơ sở</Label>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn cơ sở (tùy chọn)" />
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

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity_processed">
                  Số lượng xử lý <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity_processed"
                  name="quantity_processed"
                  type="number"
                  step="0.01"
                  required
                  placeholder="100.00"
                  onChange={handleQuantityChange}
                  className={quantityError ? "border-red-500 focus:ring-red-500" : ""}
                />
                {unitInfo && <p className="text-xs text-slate-500 mt-1">{unitInfo}</p>}
                {quantityError && <p className="text-xs text-red-600 font-semibold">{quantityError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Đơn vị <span className="text-red-500">*</span>
                </Label>
                <Select defaultValue="kg" onChange={(e) => handleUnitChange(e as any)}>
                  <SelectTrigger id="unit" name="unit">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg (Kilogram)</SelectItem>
                    <SelectItem value="g">g (Gram)</SelectItem>
                    <SelectItem value="ton">Tấn</SelectItem>
                    <SelectItem value="lbs">lbs (Pound)</SelectItem>
                    <SelectItem value="units">Đơn vị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible_person">Người phụ trách</Label>
                <Input id="responsible_person" name="responsible_person" placeholder="Nguyễn Văn A" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Nhiệt độ (°C)</Label>
                <Input id="temperature" name="temperature" type="number" step="0.1" placeholder="20" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" name="description" placeholder="Mô tả chi tiết về sự kiện..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_details">Chi tiết vị trí</Label>
              <Input id="location_details" name="location_details" placeholder="Kho A, Tầng 2" />
            </div>

            {kdeFields.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Trường dữ liệu bắt buộc (FSMA 204 KDE)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Các trường này là bắt buộc theo quy định FDA FSMA Section 204
                  </p>
                </div>
                {kdeFields.map((kde: any) => (
                  <div key={kde.kde_key} className="space-y-2">
                    <Label htmlFor={`kde_${kde.kde_key}`}>
                      {kde.kde_label}
                      {kde.is_critical && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {kde.help_text && <p className="text-xs text-slate-500 mb-1">{kde.help_text}</p>}
                    {kde.field_type === "textarea" ? (
                      <Textarea
                        id={`kde_${kde.kde_key}`}
                        value={kdeValues[kde.kde_key] || ""}
                        onChange={(e) =>
                          setKdeValues((prev) => ({
                            ...prev,
                            [kde.kde_key]: e.target.value,
                          }))
                        }
                        required={kde.is_critical}
                        placeholder={kde.kde_label}
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={`kde_${kde.kde_key}`}
                        type={kde.field_type || "text"}
                        value={kdeValues[kde.kde_key] || ""}
                        onChange={(e) =>
                          setKdeValues((prev) => ({
                            ...prev,
                            [kde.kde_key]: e.target.value,
                          }))
                        }
                        required={kde.is_critical}
                        placeholder={kde.kde_label}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {eventType === "transformation" && (
              <div className="pt-4 border-t">
                <TransformationInputSelector
                  value={transformationInputs}
                  onChange={setTransformationInputs}
                  errors={transformationErrors}
                  setErrors={setTransformationErrors}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !!quantityError ||
                  (availableStock !== null &&
                    availableStock <= 0 &&
                    ["cooling", "packing", "shipping"].includes(eventType))
                }
              >
                {isLoading ? "Đang tạo..." : "Tạo sự kiện"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {chronologicalCheck && !chronologicalCheck.valid && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Vi phạm thứ tự thời gian (Chronological Violation)</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            {/* Main error message */}
            <p className="font-medium">{chronologicalCheck.error}</p>

            {/* Detailed comparison table */}
            <div className="bg-white rounded-lg p-3 border border-red-200 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Sự kiện gần nhất:</p>
                  <p className="font-semibold text-foreground">
                    {chronologicalCheck.last_event_type_vi || chronologicalCheck.last_event_type}
                  </p>
                  <p className="text-primary font-mono">
                    {chronologicalCheck.last_event_date_formatted ||
                      (chronologicalCheck.last_event_date &&
                        new Date(chronologicalCheck.last_event_date).toLocaleString("vi-VN"))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Sự kiện đang tạo:</p>
                  <p className="font-semibold text-foreground">
                    {chronologicalCheck.attempted_event_type_vi || eventType}
                  </p>
                  <p className="text-destructive font-mono">
                    {chronologicalCheck.attempted_event_date_formatted || new Date().toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              {/* Time difference */}
              {chronologicalCheck.time_difference_human && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Chênh lệch: </span>
                    <span className="font-semibold text-destructive">
                      {chronologicalCheck.time_difference_human} trước sự kiện gần nhất
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Guidance */}
            {chronologicalCheck.guidance && (
              <p className="text-sm text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
                <strong>Hướng dẫn:</strong> {chronologicalCheck.guidance}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {chronologicalCheck && chronologicalCheck.valid && !chronologicalCheck.first_event && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Thời gian hợp lệ</AlertTitle>
          <AlertDescription className="text-green-700">
            {chronologicalCheck.message ||
              `Sự kiện này xảy ra ${chronologicalCheck.time_since_last_event_human || "sau"} sự kiện "${chronologicalCheck.last_event_type_vi}" trước đó (${chronologicalCheck.last_event_date_formatted}).`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function getFallbackKdeRequirements(eventType: string): any[] {
  const kdeMap: Record<string, any[]> = {
    shipping: [
      {
        kde_key: "destination_reference",
        kde_label: "Thông tin điểm đến (Destination Reference)",
        is_critical: true,
        field_type: "text",
        validation_rule: "NOT NULL",
        help_text: "Nhập thông tin cơ sở đích nhận hàng (tên công ty, địa chỉ, hoặc mã GLN)",
      },
    ],
    receiving: [
      {
        kde_key: "traceability_lot_code",
        kde_label: "Mã lô truy xuất (Traceability Lot Code)",
        is_critical: true,
        field_type: "text",
        validation_rule: "NOT NULL",
        help_text: "Nhập mã TLC của lô hàng nhận được từ nhà cung cấp",
      },
    ],
    harvesting: [
      {
        kde_key: "location_glo_code",
        kde_label: "Mã GLO cơ sở (GLO Location Code)",
        is_critical: true,
        field_type: "text",
        validation_rule: "NOT NULL",
        help_text: "Nhập mã GLO hoặc GLN của cơ sở",
      },
      {
        kde_key: "gps_coordinates",
        kde_label: "Tọa độ GPS (GPS Coordinates)",
        is_critical: true,
        field_type: "text",
        validation_rule: "NOT NULL",
        help_text: "Nhập tọa độ GPS với ít nhất 4 chữ số thập phân",
      },
    ],
    packing: [
      {
        kde_key: "location_glo_code",
        kde_label: "Mã GLO cơ sở đóng gói",
        is_critical: true,
        field_type: "text",
        validation_rule: "NOT NULL",
        help_text: "Nhập mã định danh cơ sở đóng gói",
      },
    ],
    transformation: [],
    cooling: [],
  }
  return kdeMap[eventType] || []
}
