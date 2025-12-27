"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, FileEdit } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CTECorrectionDialogProps {
  cteId: string
  currentData: {
    event_type: string
    event_date: string
    responsible_person: string
    quantity_processed?: number
    unit?: string
    temperature?: number
    description?: string
  }
  onSuccess: () => void
}

export function CTECorrectionDialog({ cteId, currentData, onSuccess }: CTECorrectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [correctionReason, setCorrectionReason] = useState("")
  const [newData, setNewData] = useState({
    responsible_person: currentData.responsible_person,
    quantity_processed: currentData.quantity_processed?.toString() || "",
    temperature: currentData.temperature?.toString() || "",
    description: currentData.description || "",
  })

  const handleSubmit = async () => {
    if (!correctionReason.trim()) {
      setError("Phải nhập lý do điều chỉnh")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: rpcError } = await supabase.rpc("create_correction_event", {
        p_original_cte_id: cteId,
        p_correction_reason: correctionReason,
        p_new_event_data: {
          responsible_person: newData.responsible_person,
          quantity_processed: newData.quantity_processed ? Number.parseFloat(newData.quantity_processed) : null,
          temperature: newData.temperature ? Number.parseFloat(newData.temperature) : null,
          description: newData.description,
        },
      })

      if (rpcError) throw rpcError

      if (!data.success) {
        throw new Error(data.error || "Không thể tạo correction event")
      }

      setOpen(false)
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileEdit className="h-4 w-4 mr-2" />
          Tạo Correction Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo Correction Event (FDA FSMA 204)</DialogTitle>
          <DialogDescription>
            Sự kiện CTE đã submit không thể chỉnh sửa trực tiếp. Tạo correction event mới để điều chỉnh theo quy định
            FDA.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Correction event sẽ đánh dấu bản ghi gốc là "corrected" và tạo bản ghi mới với thông tin đã điều chỉnh. Cả 2
            bản ghi đều được giữ lại để audit trail.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Lý do điều chỉnh <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="VD: Sai sót trong nhập liệu số lượng, cần điều chỉnh theo phiếu kiểm kê thực tế..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Thông tin điều chỉnh</h4>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible_person">Người phụ trách</Label>
                <Input
                  id="responsible_person"
                  value={newData.responsible_person}
                  onChange={(e) => setNewData({ ...newData, responsible_person: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Số lượng</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={newData.quantity_processed}
                    onChange={(e) => setNewData({ ...newData, quantity_processed: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Nhiệt độ (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={newData.temperature}
                    onChange={(e) => setNewData({ ...newData, temperature: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={newData.description}
                  onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo Correction Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
