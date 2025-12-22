"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createPortalSession } from "@/app/actions/stripe"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface BillingPortalButtonProps {
  companyId: string
}

export function BillingPortalButton({ companyId }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpenPortal = async () => {
    try {
      setLoading(true)
      const { url } = await createPortalSession(companyId)

      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error("[v0] Portal error:", error)
      toast.error("Không thể mở cổng thanh toán. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleOpenPortal} disabled={loading} variant="outline">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang tải...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Quản lý thanh toán
        </>
      )}
    </Button>
  )
}
