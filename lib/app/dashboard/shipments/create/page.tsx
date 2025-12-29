"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Package, Truck, FileText, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function CreateShipmentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lots, setLots] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [selectedLot, setSelectedLot] = useState("")
  const [selectedLotData, setSelectedLotData] = useState<any>(null)
  const [selectedFromFacility, setSelectedFromFacility] = useState("")
  const [selectedToFacility, setSelectedToFacility] = useState("")
  const [temperatureControlled, setTemperatureControlled] = useState(false)
  const [temperature, setTemperature] = useState("")
  const [createCTE, setCreateCTE] = useState(true) // Default enabled for FSMA compliance
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg")
  const [availableStock, setAvailableStock] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active traceability lots with available quantity
      const { data: lotsData } = await supabase
        .from("traceability_lots")
        .select("id, tlc, unit, available_quantity, products(product_name)")
        .eq("status", "active")
        .gt("available_quantity", 0)
        .order("created_at", { ascending: false })
      setLots(lotsData || [])

      // Fetch facilities
      const { data: facilitiesData } = await supabase
        .from("facilities")
        .select("id, name, location_code, address")
        .is("deleted_at", null)
        .order("name")
      setFacilities(facilitiesData || [])
    }
    fetchData()
  }, [supabase])

  // Fetch available stock when TLC is selected
  useEffect(() => {
    const fetchStock = async () => {
      if (!selectedLot) {
        setAvailableStock(null)
        setSelectedLotData(null)
        return
      }

      const lot = lots.find((l) => l.id === selectedLot)
      if (lot) {
        setAvailableStock(lot.available_quantity)
        setSelectedLotData(lot)
        setUnit(lot.unit || "kg")
      }
    }
    fetchStock()
  }, [selectedLot, lots])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    let formData: FormData
    try {
      formData = new FormData(e.currentTarget)
    } catch (err) {
      setError("Lỗi khi xử lý form. Vui lòng thử lại.")
      setIsLoading(false)
      return
    }

    // Validate quantity against available stock
    const shipQuantity = Number.parseFloat(quantity)
    if (createCTE && availableStock !== null && shipQuantity > availableStock) {
      setError(`Số lượng vận chuyển (${shipQuantity}) vượt quá tồn kho khả dụng (${availableStock} ${unit})`)
      setIsLoading(false)
      return
    }

    const shipmentData = {
      shipment_number: formData.get("shipment_number") as string,
      tlc_id: selectedLot,
      from_facility_id: selectedFromFacility,
      to_facility_id: selectedToFacility && selectedToFacility !== "none" ? selectedToFacility : null,
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
      // 1. Create Shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .insert(shipmentData)
        .select()
        .single()

      if (shipmentError) throw shipmentError

      // 2. If FSMA 204 CTE creation is enabled, create CTE and KDEs
      if (createCTE && selectedLot && shipQuantity > 0) {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        // Get from facility details for location description
        const fromFacility = facilities.find((f) => f.id === selectedFromFacility)

        // Build destination reference (FSMA 204 required KDE)
        const destinationReference = [
          formData.get("destination_company"),
          formData.get("destination_address"),
          selectedToFacility && selectedToFacility !== "none"
            ? facilities.find((f) => f.id === selectedToFacility)?.name
            : null,
        ]
          .filter(Boolean)
          .join(" - ")

        // Create CTE Shipping Event
        const cteData = {
          tlc_id: selectedLot,
          event_type: "shipping",
          event_date: formData.get("shipment_date") as string,
          facility_id: selectedFromFacility,
          responsible_person: formData.get("carrier_name") || "Shipping Department",
          description: `Vận chuyển ${shipmentData.shipment_number} - ${selectedLotData?.products?.product_name || ""}`,
          temperature: temperatureControlled && temperature ? Number.parseFloat(temperature) : null,
          quantity_processed: shipQuantity,
          quantity_in_base_unit: shipQuantity, // Assuming same unit
          unit: unit,
          location_details: fromFacility?.address || fromFacility?.name || "",
          submitted_by: user?.id,
          submitted_at: new Date().toISOString(),
          status: "draft",
          is_correction: false,
        }

        const { data: cte, error: cteError } = await supabase
          .from("critical_tracking_events")
          .insert(cteData)
          .select()
          .single()

        if (cteError) {
          console.error("CTE creation error:", cteError)
          // Don't fail the shipment, just warn
          setSuccess(
            `Đã tạo vận chuyển ${shipmentData.shipment_number}. ⚠️ Không thể tạo CTE tự động: ${cteError.message}`,
          )
        } else {
          // 3. Create KDEs for FSMA 204 compliance
          const kdeEntries = [
            {
              cte_id: cte.id,
              key_name: "destination_reference",
              key_value: destinationReference,
              kde_type: "shipping",
              is_required: true,
            },
            {
              cte_id: cte.id,
              key_name: "ship_from_location",
              key_value: `${fromFacility?.name} - ${fromFacility?.location_code || ""} - ${fromFacility?.address || ""}`,
              kde_type: "shipping",
              is_required: true,
            },
            {
              cte_id: cte.id,
              key_name: "reference_document_number",
              key_value: shipmentData.shipment_number,
              kde_type: "shipping",
              is_required: true,
            },
            {
              cte_id: cte.id,
              key_name: "carrier_info",
              key_value: `${formData.get("carrier_name") || ""} - ${formData.get("vehicle_id") || ""}`,
              kde_type: "shipping",
              is_required: false,
            },
          ]

          const { error: kdeError } = await supabase.from("key_data_elements").insert(kdeEntries)

          if (kdeError) {
            console.error("KDE creation error:", kdeError)
          }

          // 4. Update TLC shipped_quantity
          const { error: updateError } = await supabase
            .from("traceability_lots")
            .update({
              shipped_quantity: (selectedLotData?.shipped_quantity || 0) + shipQuantity,
              available_quantity: (selectedLotData?.available_quantity || 0) - shipQuantity,
            })
            .eq("id", selectedLot)

          if (updateError) {
            console.error("TLC update error:", updateError)
          }

          setSuccess(
            `✅ Đã tạo vận chuyển ${shipmentData.shipment_number} và CTE Shipping theo FSMA 204 với ${kdeEntries.length} KDEs`,
          )
        }
      } else {
        setSuccess(`Đã tạo vận chuyển ${shipmentData.shipment_number}`)
      }

      // Redirect after short delay to show success message
      setTimeout(() => {
        router.push("/dashboard/shipments")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tạo vận chuyển mới</h1>
        <p className="text-muted-foreground mt-1">Ghi nhận thông tin vận chuyển lô hàng theo FSMA 204</p>
      </div>

      {/* FSMA 204 Compliance Notice */}
      <Alert className="bg-primary/5 border-primary/20">
        <FileText className="h-4 w-4" />
        <AlertTitle>FSMA 204 Shipping CTE</AlertTitle>
        <AlertDescription>
          Khi tạo vận chuyển, hệ thống sẽ tự động tạo Critical Tracking Event (CTE) và Key Data Elements (KDEs) theo yêu
          cầu FDA FSMA Section 204.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Thông tin vận chuyển
          </CardTitle>
          <CardDescription>Điền đầy đủ thông tin để đảm bảo truy xuất nguồn gốc</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment_number">
                  Số vận chuyển <span className="text-destructive">*</span>
                </Label>
                <Input id="shipment_number" name="shipment_number" required placeholder="SHIP-2024-001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tlc_id">
                  Mã TLC <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedLot} onValueChange={setSelectedLot} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mã TLC" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.tlc} - {lot.products?.product_name} ({lot.available_quantity} {lot.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Display */}
              {selectedLot && availableStock !== null && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">
                      Tồn kho khả dụng: {availableStock.toLocaleString()} {unit}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity and Unit - Required for FSMA 204 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Số lượng vận chuyển <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableStock || undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                  {quantity && availableStock && Number.parseFloat(quantity) > availableStock && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Vượt quá tồn kho khả dụng!
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">
                    Đơn vị <span className="text-destructive">*</span>
                  </Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg (Kilogram)</SelectItem>
                      <SelectItem value="g">g (Gram)</SelectItem>
                      <SelectItem value="lb">lb (Pound)</SelectItem>
                      <SelectItem value="unit">Đơn vị</SelectItem>
                      <SelectItem value="box">Thùng</SelectItem>
                      <SelectItem value="pallet">Pallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Facility Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_facility_id">
                  Từ cơ sở <span className="text-destructive">*</span>
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

            {/* Destination Info - Required for FSMA 204 destination_reference KDE */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Thông tin điểm đến (FSMA 204 KDE)
              </h3>

              <div className="space-y-2">
                <Label htmlFor="destination_company">
                  Công ty nhận <span className="text-destructive">*</span>
                </Label>
                <Input id="destination_company" name="destination_company" required placeholder="ABC Trading Co." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_address">
                  Địa chỉ đích <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="destination_address"
                  name="destination_address"
                  required
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Địa chỉ đầy đủ của người nhận hàng (destination_reference theo FSMA 204)
                </p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment_date">
                  Ngày gửi <span className="text-destructive">*</span>
                </Label>
                <Input id="shipment_date" name="shipment_date" type="datetime-local" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_delivery">Dự kiến giao</Label>
                <Input id="expected_delivery" name="expected_delivery" type="datetime-local" />
              </div>
            </div>

            {/* Carrier Info */}
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

            {/* Temperature Control */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temperature_controlled"
                  checked={temperatureControlled}
                  onCheckedChange={(checked) => setTemperatureControlled(checked === true)}
                />
                <Label htmlFor="temperature_controlled" className="text-sm font-normal cursor-pointer">
                  Vận chuyển có kiểm soát nhiệt độ
                </Label>
              </div>

              {temperatureControlled && (
                <div className="space-y-2">
                  <Label htmlFor="temperature">Nhiệt độ vận chuyển (°C)</Label>
                  <Input
                    id="temperature"
                    name="temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="4.0"
                  />
                </div>
              )}
            </div>

            {/* FSMA 204 CTE Toggle */}
            <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Checkbox
                id="create_cte"
                checked={createCTE}
                onCheckedChange={(checked) => setCreateCTE(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="create_cte" className="text-sm font-medium cursor-pointer">
                  Tự động tạo CTE Shipping (FSMA 204)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tạo Critical Tracking Event và Key Data Elements theo yêu cầu FDA FSMA Section 204. Bao gồm:
                  destination_reference, ship_from_location, reference_document_number.
                </p>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
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
