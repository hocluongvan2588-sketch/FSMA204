"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { approveFacilityUpdateRequest, rejectFacilityUpdateRequest } from "@/app/actions/facility-update-requests"
import { useToast } from "@/hooks/use-toast"

export function FacilityUpdateRequestActions({
  requestId,
  facilityName,
}: {
  requestId: string
  facilityName: string
}) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleApprove = async () => {
    setLoading(true)

    const result = await approveFacilityUpdateRequest({
      request_id: requestId,
      apply_changes: true,
    })

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Lỗi phê duyệt",
        description: result.error,
      })
    } else {
      toast({
        title: "Phê duyệt thành công",
        description: `Đã cập nhật thông tin cơ sở: ${facilityName}`,
      })
      router.refresh()
    }

    setLoading(false)
  }

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
      })
      return
    }

    setLoading(true)

    const result = await rejectFacilityUpdateRequest({
      request_id: requestId,
      rejection_note: rejectNote,
    })

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Lỗi từ chối",
        description: result.error,
      })
    } else {
      toast({
        title: "Đã từ chối yêu cầu",
        description: `Yêu cầu cập nhật cơ sở ${facilityName} đã bị từ chối`,
      })
      setShowRejectDialog(false)
      setRejectNote("")
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <>
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleApprove} disabled={loading} className="flex-1 gap-2" variant="default">
          <Check className="h-4 w-4" />
          Phê duyệt & Áp dụng
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
              Từ chối yêu cầu cập nhật
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập lý do từ chối yêu cầu cập nhật thông tin cơ sở <strong>{facilityName}</strong>:
            </p>
            <Textarea
              placeholder="Ví dụ: Thông tin không chính xác, thiếu tài liệu chứng minh..."
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
