"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, Info, MapPin, Calendar, Thermometer, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface MissingKDE {
  kde_field: string
  field_description: string
  fsma_reference: string
  why_required: string
  icon: any
}

interface MissingKDEDetailDialogProps {
  cteId: string
  eventType: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MissingKDEDetailDialog({ cteId, eventType, open, onOpenChange }: MissingKDEDetailDialogProps) {
  const [missingKDEs, setMissingKDEs] = useState<MissingKDE[]>([])
  const [loading, setLoading] = useState(true)
  const [cteInfo, setCteInfo] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (open && cteId) {
      fetchMissingKDEs()
    }
  }, [open, cteId])

  const fetchMissingKDEs = async () => {
    setLoading(true)
    try {
      const { data: missingData, error: missingError } = await supabase.rpc("get_missing_kdes", {
        p_cte_id: cteId,
      })

      if (missingError) {
        console.error("[v0] Failed to fetch missing KDEs:", missingError)
        return
      }

      const { data: cteData, error: cteError } = await supabase
        .from("critical_tracking_events")
        .select(
          `
          *,
          traceability_lots(tlc, products(product_name)),
          facilities(name, location_code)
        `,
        )
        .eq("id", cteId)
        .single()

      if (cteError) {
        console.error("[v0] Failed to fetch CTE info:", cteError)
        return
      }

      setCteInfo(cteData)

      const formattedMissingKDEs: MissingKDE[] = (missingData || []).map((kde: any) => {
        const iconMap: Record<string, any> = {
          gps_coordinates: MapPin,
          harvest_date: Calendar,
          cooling_date: Thermometer,
          packing_date: Calendar,
          location_code: MapPin,
          lot_code: Package,
          quantity: Package,
        }

        const whyRequiredMap: Record<string, string> = {
          gps_coordinates:
            "FSMA 204 yêu cầu theo dõi vị trí chính xác của cơ sở để truy xuất nguồn gốc khi có sự cố an toàn thực phẩm",
          harvest_date: "Ngày thu hoạch là KDE bắt buộc để xác định độ tươi và tuổi thọ của sản phẩm",
          cooling_date: "Ngày làm lạnh bắt buộc cho chuỗi lạnh để đảm bảo chất lượng và an toàn thực phẩm",
          packing_date: "Ngày đóng gói là điểm quan trọng trong chuỗi cung ứng theo FSMA 204",
          location_code: "Mã định danh cơ sở bắt buộc để xác định chính xác địa điểm trong chuỗi cung ứng",
          lot_code: "Mã lô hàng là yêu cầu bắt buộc để truy xuất nguồn gốc theo FSMA 204",
          quantity: "Khối lượng/số lượng bắt buộc để kiểm soát cân đối vật chất trong chuỗi cung ứng",
        }

        return {
          kde_field: kde.missing_kde,
          field_description: kde.missing_kde.replace(/_/g, " ").toUpperCase(),
          fsma_reference: kde.fsma_reference || "FSMA 204.1(b)",
          why_required: whyRequiredMap[kde.missing_kde] || "Trường bắt buộc theo quy định FSMA 204",
          icon: iconMap[kde.missing_kde] || AlertCircle,
        }
      })

      setMissingKDEs(formattedMissingKDEs)
    } catch (error) {
      console.error("[v0] Error fetching missing KDEs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeName = () => {
    const eventTypeMap: Record<string, string> = {
      harvest: "Thu hoạch (Harvesting)",
      cooling: "Làm lạnh (Cooling)",
      packing: "Đóng gói ban đầu (Initial Packing)",
      receiving: "Tiếp nhận (Receiving)",
      transformation: "Chuyển đổi (Transformation)",
      shipping: "Vận chuyển (Shipping)",
    }
    return eventTypeMap[eventType] || eventType
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Chi tiết KDE thiếu - Không tuân thủ FSMA 204
          </DialogTitle>
          <DialogDescription>
            Sự kiện <span className="font-semibold">{getEventTypeName()}</span> thiếu các KDE (Key Data Elements) bắt
            buộc
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {cteInfo && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                <h4 className="font-semibold text-sm mb-3">Thông tin sự kiện CTE</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sản phẩm</p>
                    <p className="font-medium">{cteInfo.traceability_lots?.products?.product_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mã TLC</p>
                    <p className="font-medium">{cteInfo.traceability_lots?.tlc || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cơ sở</p>
                    <p className="font-medium">{cteInfo.facilities?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày sự kiện</p>
                    <p className="font-medium">{new Date(cteInfo.event_date).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-sm">
                  {missingKDEs.length} KDE thiếu
                </Badge>
                <p className="text-sm text-muted-foreground">Cần bổ sung để tuân thủ FSMA 204</p>
              </div>

              {missingKDEs.map((kde, index) => {
                const Icon = kde.icon
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 p-2 rounded-lg bg-red-100 dark:bg-red-900">
                        <Icon className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h5 className="font-semibold text-red-900 dark:text-red-100">{kde.field_description}</h5>
                          <Badge variant="outline" className="text-xs mt-1">
                            {kde.fsma_reference}
                          </Badge>
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border">
                          <div className="flex items-start gap-2">
                            <Info className="shrink-0 h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Tại sao bắt buộc?
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{kde.why_required}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                            Cách khắc phục:
                          </p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            Vui lòng chỉnh sửa CTE và bổ sung trường{" "}
                            <span className="font-semibold">{kde.field_description}</span>. Hệ thống sẽ tự động validate
                            và cập nhật trạng thái tuân thủ.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="shrink-0 h-5 w-5 text-amber-600" />
                <div className="space-y-2">
                  <h5 className="font-semibold text-amber-900 dark:text-amber-100">Ảnh hưởng của việc thiếu KDE</h5>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                    <li>CTE không đủ tiêu chuẩn tuân thủ FSMA 204</li>
                    <li>Không thể truy xuất nguồn gốc đầy đủ khi có sự cố</li>
                    <li>Có thể bị FDA phạt hoặc yêu cầu chỉnh sửa</li>
                    <li>Điểm tuân thủ của công ty bị giảm</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/dashboard/cte/${cteId}`}>
              <ExternalLink className="h-4 w-4" />
              Chỉnh sửa CTE ngay
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
