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
import { createSubscriptionCheckout } from "@/app/actions/stripe"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SubscribeButtonProps {
  packageId: string
  companyId: string
  packageName: string
}

export function SubscribeButton({ packageId, companyId, packageName }: SubscribeButtonProps) {
  const [open, setOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    try {
      setLoading(true)
      const { url } = await createSubscriptionCheckout(companyId, packageId, billingCycle)

      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error("[v0] Subscribe error:", error)
      toast.error("Không thể tạo thanh toán. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Đăng ký ngay</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng ký {packageName}</DialogTitle>
          <DialogDescription>
            Chọn chu kỳ thanh toán và hoàn tất đăng ký. Bạn sẽ có 14 ngày dùng thử miễn phí.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="mb-3 block">Chu kỳ thanh toán</Label>
          <RadioGroup value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="cursor-pointer">
                Hàng tháng
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yearly" id="yearly" />
              <Label htmlFor="yearly" className="cursor-pointer">
                Hàng năm (tiết kiệm hơn)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubscribe} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tiếp tục thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
