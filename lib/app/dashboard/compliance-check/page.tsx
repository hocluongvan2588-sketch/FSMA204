"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, MapPin, Thermometer, FileWarning } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ComplianceWarning {
  cte_id: string
  event_type: string
  event_date: string
  tlc: string
  product_name: string
  facility_name: string
  location_code: string
  company_name: string
  missing_optional_kdes: string[]
  missing_temperature_data: boolean
  gps_status: "valid" | "no_gps" | "invalid_gps"
  created_at: string
}

export default function ComplianceCheckPage() {
  const [warnings, setWarnings] = useState<ComplianceWarning[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, withWarnings: 0, compliant: 0 })
  const supabase = createClient()

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    setIsLoading(true)

    // Fetch warnings from view
    const { data: warningsData, error } = await supabase
      .from("cte_compliance_warnings")
      .select("*")
      .order("event_date", { ascending: false })

    if (warningsData && !error) {
      setWarnings(warningsData)
    }

    // Get stats
    const { count: totalCount } = await supabase
      .from("critical_tracking_events")
      .select("*", { count: "exact", head: true })

    const withWarnings = warningsData?.length || 0
    setStats({
      total: totalCount || 0,
      withWarnings,
      compliant: (totalCount || 0) - withWarnings,
    })

    setIsLoading(false)
  }

  const getGPSStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge variant="default" className="bg-green-500">
            GPS Hợp lệ
          </Badge>
        )
      case "no_gps":
        return <Badge variant="secondary">Không có GPS</Badge>
      case "invalid_gps":
        return <Badge variant="destructive">GPS Không hợp lệ</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kiểm tra tuân thủ FSMA 204</h1>
        <p className="text-muted-foreground mt-1">Danh sách các CTE cần bổ sung thông tin trước khi xuất báo cáo FDA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số CTE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Có cảnh báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.withWarnings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Tuân thủ đầy đủ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.compliant}</div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Đang tải dữ liệu...</CardContent>
        </Card>
      ) : warnings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Hoàn hảo!</h3>
            <p className="text-muted-foreground">Tất cả CTE đều tuân thủ đầy đủ yêu cầu FSMA 204</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {warnings.map((warning) => (
            <Card key={warning.cte_id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {warning.product_name} - {warning.tlc}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {warning.facility_name} • {new Date(warning.event_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <Badge>{warning.event_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Missing Optional KDEs */}
                {warning.missing_optional_kdes.length > 0 && (
                  <Alert>
                    <FileWarning className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Thiếu KDE không bắt buộc:</strong> {warning.missing_optional_kdes.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Temperature Warning */}
                {warning.missing_temperature_data && (
                  <Alert>
                    <Thermometer className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Thiếu dữ liệu nhiệt độ</strong> cho sự kiện chuỗi lạnh
                    </AlertDescription>
                  </Alert>
                )}

                {/* GPS Status */}
                {warning.gps_status !== "valid" && (
                  <Alert variant={warning.gps_status === "invalid_gps" ? "destructive" : "default"}>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Vấn đề GPS:</strong>{" "}
                      {warning.gps_status === "no_gps" ? "Cơ sở chưa có tọa độ GPS" : "Tọa độ GPS không hợp lệ (0,0)"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2 pt-2">
                  {getGPSStatusBadge(warning.gps_status)}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/cte/${warning.cte_id}`}>Bổ sung thông tin</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
