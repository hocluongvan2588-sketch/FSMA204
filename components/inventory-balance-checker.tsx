"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, AlertCircle, TrendingDown, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { validateTLCInventoryBalance, validateAllTLCInventoryBalances } from "@/lib/utils/inventory-balance-validator"

interface InventoryValidationProps {
  tlcId?: string
  companyId: string
  showAllTLCs?: boolean
}

export function InventoryBalanceChecker({ tlcId, companyId, showAllTLCs = false }: InventoryValidationProps) {
  const [validation, setValidation] = useState<any>(null)
  const [allValidations, setAllValidations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const runValidation = async () => {
      setLoading(true)
      setError(null)

      try {
        if (tlcId) {
          // Single TLC validation
          const balance = await validateTLCInventoryBalance(tlcId)
          setValidation(balance)
        } else if (showAllTLCs) {
          // All TLCs validation
          const results = await validateAllTLCInventoryBalances(companyId)
          setAllValidations(results)
        }
      } catch (err: any) {
        console.error("[v0] Inventory validation error:", err)
        setError(err.message || "Lỗi khi kiểm tra tồn kho")
      } finally {
        setLoading(false)
      }
    }

    runValidation()
  }, [tlcId, companyId, showAllTLCs])

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Kiểm tra tồn kho...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (validation && !showAllTLCs) {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case "critical":
          return "bg-red-50 border-red-200"
        case "high":
          return "bg-orange-50 border-orange-200"
        case "medium":
          return "bg-amber-50 border-amber-200"
        default:
          return "bg-emerald-50 border-emerald-200"
      }
    }

    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case "critical":
          return <AlertTriangle className="h-5 w-5 text-red-600" />
        case "high":
          return <AlertCircle className="h-5 w-5 text-orange-600" />
        case "medium":
          return <AlertCircle className="h-5 w-5 text-amber-600" />
        default:
          return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      }
    }

    return (
      <Card className={`rounded-2xl border ${getSeverityColor(validation.severity)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSeverityIcon(validation.severity)}
              <CardTitle className="text-lg">Kiểm tra Tồn kho - {validation.tlc_code}</CardTitle>
            </div>
            <Badge variant={validation.is_valid ? "default" : "destructive"}>{validation.severity.toUpperCase()}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inventory Balance Formula */}
          <div className="p-4 rounded-xl bg-white/50">
            <p className="text-sm font-mono text-muted-foreground mb-2">
              Công thức: Tồn kho = ∑Nhập − ∑Xuất − ∑Hao hụt
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tổng Nhập Vào (KDE)</p>
                <p className="text-2xl font-bold text-blue-600">{validation.total_input.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng Xuất Đi (KDE)</p>
                <p className="text-2xl font-bold text-orange-600">{validation.total_output.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hao hụt/Chế biến</p>
                <p className="text-2xl font-bold text-amber-600">{validation.total_loss_processing.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tồn kho Dự kiến</p>
                <p className="text-2xl font-bold text-slate-600">{validation.expected_inventory.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actual vs Expected */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-100/30 border border-emerald-200">
              <p className="text-xs text-muted-foreground">Tồn kho Thực tế</p>
              <p className="text-3xl font-bold text-emerald-600">{validation.actual_inventory.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100/30 border border-slate-200">
              <p className="text-xs text-muted-foreground">Tồn kho Dự kiến</p>
              <p className="text-3xl font-bold text-slate-600">{validation.expected_inventory.toFixed(2)}</p>
            </div>
          </div>

          {/* Variance Analysis */}
          {validation.variance > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-red-900 mb-1">Chênh lệch: {validation.variance.toFixed(2)}</p>
                  <p className="text-sm text-red-700 mb-2">
                    ({validation.variance_percentage.toFixed(1)}% của dự kiến)
                  </p>
                  <p className="text-sm text-red-800">{validation.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Impact */}
          {validation.compliance_deduction > 0 && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tác động Tuân thủ:</strong> Dữ liệu bất thường này sẽ trừ{" "}
                <span className="font-bold">{validation.compliance_deduction} điểm</span> khỏi điểm tuân thủ FSMA 204
              </AlertDescription>
            </Alert>
          )}

          {validation.is_valid && (
            <Alert className="rounded-xl bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                ✅ Tồn kho hợp lý - Không có vấn đề tuân thủ
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  if (allValidations.length > 0 && showAllTLCs) {
    const abnormalCount = allValidations.filter((v) => !v.validation_passed).length
    const totalComplianceDeduction = allValidations.reduce(
      (sum, v) => sum + v.inventory_balance.compliance_deduction,
      0,
    )

    return (
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kết quả Kiểm tra Tồn kho Toàn bộ</CardTitle>
              <Button size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Xuất Báo cáo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-100 text-center">
                <p className="text-sm text-muted-foreground">Tổng TLC Kiểm tra</p>
                <p className="text-3xl font-bold text-slate-700">{allValidations.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-100 text-center">
                <p className="text-sm text-muted-foreground">Hợp lệ</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {allValidations.filter((v) => v.validation_passed).length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-red-100 text-center">
                <p className="text-sm text-muted-foreground">Bất thường</p>
                <p className="text-3xl font-bold text-red-600">{abnormalCount}</p>
              </div>
            </div>

            {abnormalCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tổng trừ điểm tuân thủ:</strong> {totalComplianceDeduction} điểm từ dữ liệu bất thường
                </AlertDescription>
              </Alert>
            )}

            {/* List of Abnormal TLCs */}
            {abnormalCount > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Danh sách TLC Bất thường:</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allValidations
                    .filter((v) => !v.validation_passed)
                    .map((result) => (
                      <div
                        key={result.tlc_id}
                        className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-between justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-red-900">{result.tlc_code}</p>
                          <p className="text-xs text-red-700">
                            Chênh lệch: {result.inventory_balance.variance.toFixed(2)} (
                            {result.inventory_balance.variance_percentage.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">-{result.inventory_balance.compliance_deduction}pts</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
