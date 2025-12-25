"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar } from "lucide-react"
import Link from "next/link"

interface SubscriptionAlertProps {
  companyId: string
}

export function SubscriptionAlert({ companyId }: SubscriptionAlertProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch(`/api/subscription-status?companyId=${companyId}`)
        const data = await response.json()

        if (data.daysRemaining !== undefined) {
          setDaysRemaining(data.daysRemaining)
        }
      } catch (error) {
        console.error("[v0] Failed to check subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [companyId])

  if (loading || daysRemaining === null || daysRemaining === -1 || daysRemaining > 7) {
    return null
  }

  if (daysRemaining <= 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Gói dịch vụ đã hết hạn</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.</p>
          <Button asChild size="sm">
            <Link href="/admin/my-subscription">Gia hạn ngay</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <Calendar className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Gói dịch vụ sắp hết hạn</AlertTitle>
      <AlertDescription className="text-amber-800">
        <p className="mb-2">
          Gói dịch vụ của bạn sẽ hết hạn trong <strong>{daysRemaining} ngày</strong>. Gia hạn ngay để tránh gián đoạn.
        </p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-amber-600 text-amber-900 hover:bg-amber-100 bg-transparent"
        >
          <Link href="/admin/my-subscription">Xem chi tiết</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
