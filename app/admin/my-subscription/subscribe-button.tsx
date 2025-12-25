"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PaymentCheckoutModal } from "@/components/payment-checkout-modal"

interface SubscribeButtonProps {
  packageId: string
  companyId: string
  packageName: string
  monthlyPrice?: number
  yearlyPrice?: number
}

export function SubscribeButton({
  packageId,
  companyId,
  packageName,
  monthlyPrice = 0,
  yearlyPrice = 0,
}: SubscribeButtonProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const currentPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice

  return (
    <>
      <Button onClick={() => setShowCheckout(true)} className="w-full">
        Đăng ký ngay
      </Button>

      <PaymentCheckoutModal
        open={showCheckout}
        onOpenChange={setShowCheckout}
        packageName={packageName}
        packageId={packageId}
        companyId={companyId}
        monthlyPrice={monthlyPrice}
        yearlyPrice={yearlyPrice}
        billingCycle={billingCycle}
        onBack={() => setBillingCycle("monthly")}
      />
    </>
  )
}
