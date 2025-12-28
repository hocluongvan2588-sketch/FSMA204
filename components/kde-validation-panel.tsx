"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { validateKDE } from "@/lib/utils/kde-validator"

interface KDEValidationPanelProps {
  eventType: string
  kdeValues: Record<string, string>
  onValidationChange?: (isValid: boolean) => void
}

export function KDEValidationPanel({ eventType, kdeValues, onValidationChange }: KDEValidationPanelProps) {
  const validation = validateKDE(eventType, kdeValues)

  if (onValidationChange) {
    onValidationChange(validation.isValid)
  }

  if (validation.isValid) {
    return (
      <Alert className="border-green-300 bg-green-50">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800">FSMA 204 - Dữ liệu hợp lệ</AlertTitle>
        <AlertDescription className="text-green-700">
          Tất cả {validation.results.length} trường KDE bắt buộc đã được điền đầy đủ và đúng định dạng.
        </AlertDescription>
      </Alert>
    )
  }

  const errors = validation.results.filter((r) => r.severity === "error")
  const warnings = validation.results.filter((r) => r.severity === "warning")

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">{errors.length} lỗi FSMA 204 cần sửa</AlertTitle>
          <AlertDescription className="text-red-700">
            Các trường bắt buộc theo FDA FSMA Section 204.4 chưa được điền đúng
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">{warnings.length} cảnh báo chất lượng dữ liệu</AlertTitle>
          <AlertDescription className="text-amber-700">
            Dữ liệu nên được bổ sung để tăng tính minh bạch
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Chi tiết kiểm tra KDE ({validation.results.length} trường)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {validation.results.map((result, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                result.severity === "error"
                  ? "bg-red-50 border-red-200"
                  : result.severity === "warning"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {result.severity === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                    {result.severity === "warning" && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    {result.severity === "info" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    <span className="font-semibold text-sm">{result.field}</span>
                  </div>
                  <p className="text-sm text-slate-700">{result.message}</p>
                  {result.reference && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">Tham chiếu: {result.reference}</p>
                  )}
                </div>
                <Badge
                  variant={
                    result.severity === "error"
                      ? "destructive"
                      : result.severity === "warning"
                        ? "secondary"
                        : "default"
                  }
                  className="shrink-0"
                >
                  {result.severity === "error" ? "Bắt buộc" : result.severity === "warning" ? "Nên có" : "OK"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
