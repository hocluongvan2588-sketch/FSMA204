"use client"

import { Badge } from "@/components/ui/badge"
import { Thermometer, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TemperatureIndicatorProps {
  temperature: number | null
  productType?: string
  eventType?: string
  className?: string
}

export function TemperatureIndicator({
  temperature,
  productType = "unknown",
  eventType,
  className,
}: TemperatureIndicatorProps) {
  if (temperature === null) return null

  const temperatureRanges: Record<string, { min: number; max: number; label: string }> = {
    berries: { min: 2, max: 4, label: "Quả mọng (FDA: 2-4°C)" },
    leafy_greens: { min: 0, max: 5, label: "Rau lá xanh (FDA: 0-5°C)" },
    herbs: { min: 0, max: 2, label: "Rau thơm (FDA: 0-2°C)" },
    tomatoes: { min: 10, max: 13, label: "Cà chua (FDA: 10-13°C)" },
    tropical: { min: 10, max: 15, label: "Trái cây nhiệt đới (FDA: 10-15°C)" },
    cucurbits: { min: 7, max: 10, label: "Bầu bí (FDA: 7-10°C)" },
    unknown: { min: 0, max: 7, label: "Mặc định (FDA: 0-7°C)" },
  }

  const range = temperatureRanges[productType] || temperatureRanges.unknown
  const isInRange = temperature >= range.min && temperature <= range.max
  const isCriticalLow = temperature < range.min - 5
  const isCriticalHigh = temperature > range.max + 5

  const getSeverity = () => {
    if (isCriticalLow || isCriticalHigh) return "critical"
    if (!isInRange) return "warning"
    return "safe"
  }

  const severity = getSeverity()

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Thermometer
          className={`h-5 w-5 ${
            severity === "critical" ? "text-red-600" : severity === "warning" ? "text-amber-600" : "text-green-600"
          }`}
        />
        <Badge
          variant={severity === "critical" ? "destructive" : severity === "warning" ? "secondary" : "default"}
          className="text-base px-3 py-1"
        >
          {temperature.toFixed(1)}°C
        </Badge>
        {isInRange ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
      </div>

      <div className="bg-slate-100 rounded-lg p-3">
        <p className="text-xs text-slate-600 mb-2">{range.label}</p>
        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
          {/* Safe zone */}
          <div
            className="absolute h-full bg-green-500"
            style={{
              left: `${(range.min / 20) * 100}%`,
              width: `${((range.max - range.min) / 20) * 100}%`,
            }}
          />
          {/* Current temperature marker */}
          <div
            className={`absolute h-full w-1 ${
              severity === "critical" ? "bg-red-600" : severity === "warning" ? "bg-amber-600" : "bg-emerald-700"
            }`}
            style={{
              left: `${Math.min(Math.max((temperature / 20) * 100, 0), 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{range.min}°C</span>
          <span>{range.max}°C</span>
        </div>
      </div>

      {!isInRange && eventType === "cooling" && (
        <Alert className={`${severity === "critical" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
          <AlertTriangle className={`h-4 w-4 ${severity === "critical" ? "text-red-600" : "text-amber-600"}`} />
          <AlertDescription className={`text-sm ${severity === "critical" ? "text-red-800" : "text-amber-800"}`}>
            {isCriticalLow && (
              <span>
                <strong>Vi phạm nghiêm trọng:</strong> Nhiệt độ quá thấp có thể gây hư hại sản phẩm. FDA Food Code yêu
                cầu tối thiểu {range.min}°C.
              </span>
            )}
            {isCriticalHigh && (
              <span>
                <strong>Nguy cơ an toàn thực phẩm:</strong> Nhiệt độ quá cao tạo điều kiện vi khuẩn phát triển. FDA yêu
                cầu tối đa {range.max}°C.
              </span>
            )}
            {!isCriticalLow && !isCriticalHigh && (
              <span>
                <strong>Cảnh báo:</strong> Nhiệt độ ngoài khoảng tối ưu ({range.min}-{range.max}°C) theo FDA Food Code.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
