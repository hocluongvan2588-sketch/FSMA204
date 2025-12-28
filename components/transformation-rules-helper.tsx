"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, CheckCircle2, AlertCircle } from "lucide-react"

interface TransformationRulesHelperProps {
  eventType: string
  hasHarvestEvent: boolean
  hasReceivingEvent: boolean
}

export function TransformationRulesHelper({
  eventType,
  hasHarvestEvent,
  hasReceivingEvent,
}: TransformationRulesHelperProps) {
  if (eventType !== "transformation") return null

  const canProceed = hasHarvestEvent || hasReceivingEvent
  const missingBoth = !hasHarvestEvent && !hasReceivingEvent

  return (
    <Card className={`${missingBoth ? "border-red-300" : "border-blue-300"} border-2`}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          Quy tắc Transformation - FSMA 204
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className={missingBoth ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}>
          <AlertDescription className={`text-sm ${missingBoth ? "text-red-800" : "text-blue-800"}`}>
            <strong>Điều kiện bắt buộc:</strong> Phải có ít nhất một trong hai sự kiện:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li className="flex items-center gap-2">
                {hasHarvestEvent ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span>
                  Sự kiện <strong>Harvest</strong> (Thu hoạch)
                </span>
              </li>
              <li className="flex items-center gap-2">
                {hasReceivingEvent ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span>
                  Sự kiện <strong>Receiving</strong> (Tiếp nhận)
                </span>
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">Quy tắc nghiệp vụ:</p>
          <div className="space-y-1 text-slate-700">
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">
                1
              </Badge>
              <p>
                Sản phẩm tự trồng → Cần có sự kiện <strong>Harvest</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">
                2
              </Badge>
              <p>
                Sản phẩm mua từ nhà cung cấp → Cần có sự kiện <strong>Receiving</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">
                3
              </Badge>
              <p>Transformation PHẢI có ít nhất 1 input source</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">
                4
              </Badge>
              <p>Quantity output ≤ Total input quantity (có waste)</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-slate-500">
            <strong>Tham chiếu:</strong> FDA FSMA Section 204.4(b) - Transformation events must establish clear linkage
            to source materials via harvest or receiving events.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
