"use client"

import type React from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PAYMENT_GATEWAYS, type PaymentGateway } from "@/lib/payment-gateways"
import { CreditCard, Wallet, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentGatewaySelectorProps {
  currency: "USD" | "VND"
  selectedGateway: PaymentGateway
  onSelectGateway: (gateway: PaymentGateway) => void
  className?: string
}

const GATEWAY_ICONS: Record<PaymentGateway, React.ReactNode> = {
  stripe: <CreditCard className="h-5 w-5" />,
  vnpay: <Wallet className="h-5 w-5" />,
  momo: <Wallet className="h-5 w-5" />,
  zalopay: <Zap className="h-5 w-5" />,
}

export function PaymentGatewaySelector({
  currency,
  selectedGateway,
  onSelectGateway,
  className,
}: PaymentGatewaySelectorProps) {
  const availableGateways = Object.entries(PAYMENT_GATEWAYS)
    .filter(([_, config]) => config.enabled && config.supportedCurrencies.includes(currency))
    .map(([key, config]) => ({ key: key as PaymentGateway, config }))

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">Phương thức thanh toán</Label>
      <RadioGroup
        value={selectedGateway}
        onValueChange={(value) => onSelectGateway(value as PaymentGateway)}
        className="grid gap-3"
      >
        {availableGateways.map(({ key, config }) => (
          <label key={key} htmlFor={`gateway-${key}`} className="cursor-pointer">
            <Card
              className={cn(
                "relative flex items-center gap-4 p-4 transition-all hover:border-primary/50",
                selectedGateway === key && "border-primary bg-primary/5",
              )}
            >
              <RadioGroupItem value={key} id={`gateway-${key}`} className="shrink-0" />

              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {GATEWAY_ICONS[key]}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{config.displayNameVi}</p>
                    {config.recommended && currency === "VND" && (
                      <Badge variant="secondary" className="text-xs">
                        Khuyên dùng
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{config.displayName}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Phí giao dịch</p>
                  <p className="text-sm font-medium">{config.transactionFee}%</p>
                </div>
              </div>

              {selectedGateway === key && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
            </Card>
          </label>
        ))}
      </RadioGroup>

      {currency === "VND" && (
        <p className="text-xs text-muted-foreground px-1">
          Thanh toán bằng VND với các phương thức phổ biến tại Việt Nam
        </p>
      )}
    </div>
  )
}
