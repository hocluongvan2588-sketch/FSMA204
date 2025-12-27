import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import type { ChronologicalCheckResult } from "@/lib/utils/chronological-validator"
import { formatTimeDifference } from "@/lib/utils/chronological-validator"

interface ChronologicalViolationCheckerProps {
  checkResult: ChronologicalCheckResult | null
  isLoading?: boolean
  className?: string
}

export function ChronologicalViolationChecker({
  checkResult,
  isLoading = false,
  className = "",
}: ChronologicalViolationCheckerProps) {
  if (!checkResult) return null

  if (checkResult.valid) {
    return (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          <strong>✓ Thời gian sự kiện hợp lệ</strong>
          {checkResult.time_since_last_event_seconds !== undefined && (
            <p className="text-sm mt-1">
              {formatTimeDifference(checkResult.time_since_last_event_seconds)} sau sự kiện cuối cùng (
              {checkResult.last_event_type})
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>⏰ Violation: Chronological Order Invalid</strong>

        <div className="mt-2 space-y-2 text-sm">
          <p>{checkResult.error}</p>

          {checkResult.last_event_type && checkResult.last_event_date && (
            <div className="bg-red-50 rounded p-2 font-mono text-xs">
              <div className="text-red-700">
                Last Event: <strong>{checkResult.last_event_type}</strong>
              </div>
              <div className="text-red-700">
                at <strong>{new Date(checkResult.last_event_date).toLocaleString("vi-VN")}</strong>
              </div>

              {checkResult.time_difference_seconds !== undefined && (
                <div className="mt-2 text-red-900">
                  ⚠️ Attempted event is{" "}
                  <strong>{formatTimeDifference(Math.abs(checkResult.time_difference_seconds))}</strong> earlier!
                </div>
              )}
            </div>
          )}

          {checkResult.guidance && (
            <div className="border-t border-red-200 pt-2 mt-2">
              <p className="font-semibold text-red-900">💡 Required Action:</p>
              <p className="text-red-800 mt-1">{checkResult.guidance}</p>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
