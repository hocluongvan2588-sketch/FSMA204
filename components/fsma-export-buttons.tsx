"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FSMAExportButtonsProps {
  facilityId?: string
  fromDate?: string
  toDate?: string
}

export function FSMAExportButtons({ facilityId, fromDate, toDate }: FSMAExportButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [recordCount, setRecordCount] = useState<number | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const { toast } = useToast()

  const handleCheckRecords = async () => {
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append("fromDate", fromDate)
      if (toDate) params.append("toDate", toDate)
      if (facilityId) params.append("facilityId", facilityId)

      const response = await fetch(`/api/reports/export-cte/status?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to check records")

      const data = await response.json()
      setRecordCount(data.totalRecords)

      if (data.totalRecords === 0) {
        toast({
          title: "No data",
          description: "No CTE records found for export",
          variant: "destructive",
        })
        return
      }

      if (data.totalRecords > 10000) {
        toast({
          title: "Large dataset detected",
          description: `${data.totalRecords.toLocaleString()} records. Using streaming export for optimal performance.`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleStandardExport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append("fromDate", fromDate)
      if (toDate) params.append("toDate", toDate)
      if (facilityId) params.append("facilityId", facilityId)

      const response = await fetch(`/api/reports/export-cte?${params.toString()}`, { method: "POST" })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fsma204-cte-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: `Exported ${recordCount || "CTE"} records as CSV (sortable in Excel)`,
      })
      setShowDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamingExport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append("fromDate", fromDate)
      if (toDate) params.append("toDate", toDate)
      if (facilityId) params.append("facilityId", facilityId)

      const response = await fetch(`/api/reports/export-cte-streaming?${params.toString()}`, { method: "POST" })

      if (!response.ok) throw new Error("Streaming export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fsma204-cte-export-streaming-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Exported CTE records via streaming. Available for 24 hours.",
      })
      setShowDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent" onClick={handleCheckRecords}>
          <Download className="h-4 w-4" />
          Xuất CTE Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xuất báo cáo CTE</DialogTitle>
          <DialogDescription>Chọn định dạng xuất phù hợp với dung lượng dữ liệu</DialogDescription>
        </DialogHeader>

        {recordCount !== null && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tổng số bản ghi: <strong>{recordCount.toLocaleString()}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {recordCount > 10000
                  ? "⚠️ Dữ liệu lớn - khuyên dùng Streaming Export"
                  : "✓ Dữ liệu nhỏ - có thể dùng Standard Export"}
              </p>

              <div className="grid gap-3">
                <Button onClick={handleStandardExport} disabled={isLoading || recordCount > 10000} className="w-full">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Standard Export (CSV)
                  {recordCount <= 10000 && " ✓"}
                </Button>

                <Button
                  onClick={handleStreamingExport}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Streaming Export (cho 10k+)
                  {recordCount > 10000 && " ⚡"}
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-4">
                Cả hai định dạng đều:
                <br />• Sortable trong Excel
                <br />• Đầy đủ FSMA 204 KDE
                <br />• Có sẵn trong 24 giờ
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
