"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Clock } from "lucide-react"

interface ExportStatus {
  recordCount: number
  lastExportTime?: string
  exportMethod: "standard" | "streaming" | "none"
  status: "ready" | "exporting" | "error"
  memoryUsageMB: number
}

export function ExportStatusMonitor() {
  const [status, setStatus] = useState<ExportStatus>({
    recordCount: 0,
    exportMethod: "none",
    status: "ready",
    memoryUsageMB: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkExportStatus = async () => {
      try {
        const response = await fetch("/api/reports/export-cte/status")
        if (!response.ok) throw new Error("Failed to check status")

        const data = await response.json()
        const memUsage = typeof window !== "undefined" ? performance.memory?.usedJSHeapSize || 0 : 0

        setStatus({
          recordCount: data.totalRecords,
          lastExportTime: data.timestamp,
          exportMethod: data.totalRecords > 10000 ? "streaming" : "standard",
          status: data.totalRecords > 0 ? "ready" : "ready",
          memoryUsageMB: Math.round(memUsage / 1024 / 1024),
        })
      } catch (error) {
        console.error("[v0] Status check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkExportStatus()
    // Refresh every 5 minutes
    const interval = setInterval(checkExportStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return null
  }

  return (
    <Card className="border-blue-100 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          Export System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600">Total CTE Records</p>
            <p className="text-lg font-bold text-blue-600">{status.recordCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Export Method</p>
            <p className="text-sm font-medium">{status.recordCount > 10000 ? "⚡ Streaming" : "✓ Standard"}</p>
          </div>
        </div>

        {status.recordCount > 10000 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-700">
              Large dataset detected. Using streaming export to prevent crashes. Data available for 24 hours.
            </AlertDescription>
          </Alert>
        )}

        {status.recordCount > 0 && status.recordCount <= 10000 && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700">
              {status.recordCount.toLocaleString()} records ready for export using standard CSV format.
            </AlertDescription>
          </Alert>
        )}

        {status.recordCount === 0 && (
          <Alert className="border-gray-200 bg-gray-50">
            <AlertTriangle className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-xs text-gray-700">
              No CTE records found. Create some events before exporting.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-slate-500 mt-2">Last checked: {new Date().toLocaleTimeString("vi-VN")}</p>
      </CardContent>
    </Card>
  )
}
