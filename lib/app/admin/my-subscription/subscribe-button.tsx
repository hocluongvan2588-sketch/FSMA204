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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PaymentGatewaySelector } from "@/components/payment-gateway-selector"
import { createSubscriptionCheckout } from "@/app/actions/stripe"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { type PaymentGateway, convertUSDtoVND, formatPrice } from "@/lib/payment-gateways"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [open, setOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [currency, setCurrency] = useState<"USD" | "VND">("VND")
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>("vnpay")
  const [loading, setLoading] = useState(false)

  const currentPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice
  const displayPrice = currency === "VND" ? convertUSDtoVND(currentPrice) : currentPrice
  // </CHANGE>

  const handleSubscribe = async () => {
    try {
      setLoading(true)

      if (paymentGateway === "stripe") {
        const { url } = await createSubscriptionCheckout(companyId, packageId, billingCycle)
        if (url) {
          window.location.href = url
        }
      } else if (paymentGateway === "vnpay") {
        // Call VNPay API
        const response = await fetch("/api/vnpay/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            packageId,
            billingCycle,
            amount: displayPrice,
            currency,
          }),
        })

        const data = await response.json()

        if (data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          throw new Error(data.error || "Không thể tạo thanh toán VNPay")
        }
      } else {
        toast.error(`${paymentGateway} chưa được tích hợp. Vui lòng chọn phương thức khác.`)
      }
      // </CHANGE>
    } catch (error: any) {
      console.error("[v0] Subscribe error:", error)
      toast.error(error.message || "Không thể tạo thanh toán. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Đăng ký ngay</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Đăng ký {packageName}</DialogTitle>
          <DialogDescription>
            Chọn chu kỳ thanh toán, tiền tệ và phương thức thanh toán phù hợp với bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="mb-3 block text-sm font-medium">Tiền tệ</Label>
            <Tabs
              value={currency}
              onValueChange={(v) => {
                setCurrency(v as "USD" | "VND")
                // Auto-select appropriate gateway
                if (v === "VND") {
                  setPaymentGateway("vnpay")
                } else {
                  setPaymentGateway("stripe")
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="VND">Việt Nam Đồng (₫)</TabsTrigger>
                <TabsTrigger value="USD">US Dollar ($)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* </CHANGE> */}

          {/* Billing cycle selection */}
          <div>
            <Label className="mb-3 block text-sm font-medium">Chu kỳ thanh toán</Label>
            <RadioGroup value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="cursor-pointer font-medium">
                    Hàng tháng
                  </Label>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(currency === "VND" ? convertUSDtoVND(monthlyPrice) : monthlyPrice, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <div>
                    <Label htmlFor="yearly" className="cursor-pointer font-medium">
                      Hàng năm
                    </Label>
                    <p className="text-xs text-muted-foreground">Tiết kiệm 2 tháng</p>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(currency === "VND" ? convertUSDtoVND(yearlyPrice) : yearlyPrice, currency)}
                </span>
              </div>
            </RadioGroup>
          </div>

          <PaymentGatewaySelector
            currency={currency}
            selectedGateway={paymentGateway}
            onSelectGateway={setPaymentGateway}
          />
          {/* </CHANGE> */}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gói:</span>
              <span className="font-medium">{packageName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chu kỳ:</span>
              <span className="font-medium">{billingCycle === "monthly" ? "Hàng tháng" : "Hàng năm"}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Tổng cộng:</span>
              <span className="text-lg font-bold text-primary">{formatPrice(displayPrice, currency)}</span>
            </div>
            {currency === "VND" && <p className="text-xs text-muted-foreground">(Tỷ giá: 1 USD ≈ 25,000 VND)</p>}
          </div>
          {/* </CHANGE> */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubscribe} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Thanh toán {formatPrice(displayPrice, currency)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
