"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function CTEApprovalActions({ cteId }: { cteId: string }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setLoading(true)
    const supabase = createClient()

    // For now, just add a system log since we don't have approval_status field yet
    await supabase.from("system_logs").insert({
      entity_type: "critical_tracking_events",
      entity_id: cteId,
      action: "approve",
      description: "CTE đã được phê duyệt",
    })

    setLoading(false)
    router.refresh()
  }

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }

    setLoading(true)
    const supabase = createClient()

    await supabase.from("system_logs").insert({
      entity_type: "critical_tracking_events",
      entity_id: cteId,
      action: "reject",
      description: `CTE bị từ chối: ${rejectNote}`,
    })

    setLoading(false)
    setShowRejectDialog(false)
    setRejectNote("")
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleApprove} disabled={loading} className="flex-1 gap-2" variant="default">
          <Check className="h-4 w-4" />
          Phê duyệt
        </Button>
        <Button
          onClick={() => setShowRejectDialog(true)}
          disabled={loading}
          className="flex-1 gap-2"
          variant="destructive"
        >
          <X className="h-4 w-4" />
          Từ chối
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Từ chối CTE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Vui lòng nhập lý do từ chối sự kiện này:</p>
            <Textarea
              placeholder="Ví dụ: Thiếu thông tin nhiệt độ, dữ liệu không chính xác..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
