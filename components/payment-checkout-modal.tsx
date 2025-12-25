"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, ArrowLeft, CreditCard, QrCode } from "lucide-react"
import { toast } from "sonner"
import { createSubscriptionCheckout } from "@/app/actions/stripe"
import { formatPrice, convertUSDtoVND } from "@/lib/payment-gateways"

interface PaymentCheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageName: string
  packageId: string
  companyId: string
  monthlyPrice: number
  yearlyPrice: number
  billingCycle: "monthly" | "yearly"
  onBack?: () => void
}

const PaymentCheckoutModal = ({
  open,
  onOpenChange,
  packageName,
  packageId,
  companyId,
  monthlyPrice,
  yearlyPrice,
  billingCycle,
  onBack,
}: PaymentCheckoutModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "vnpay">("stripe")
  const [loading, setLoading] = useState(false)

  const currentPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice
  const vndPrice = convertUSDtoVND(currentPrice)
  const taxAmount = currentPrice * 0.1 // 10% VAT
  const totalPrice = currentPrice + taxAmount

  const handlePayment = async () => {
    try {
      setLoading(true)

      if (selectedMethod === "stripe") {
        const { url } = await createSubscriptionCheckout(companyId, packageId, billingCycle)
        if (url) {
          window.location.href = url
        }
      } else if (selectedMethod === "vnpay") {
        const response = await fetch("/api/vnpay/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            packageId,
            billingCycle,
            amount: vndPrice,
            currency: "VND",
          }),
        })

        const data = await response.json()

        if (data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          throw new Error(data.error || "Không thể tạo thanh toán VNPay")
        }
      }
    } catch (error: any) {
      console.error("[v0] Payment error:", error)
      toast.error(error.message || "Không thể xử lý thanh toán")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] p-0 gap-0 overflow-hidden rounded-[2.5rem] md:max-h-[90vh]">
        <DialogTitle className="sr-only">Thanh toán đơn hàng</DialogTitle>
        <DialogDescription className="sr-only">
          Chọn phương thức thanh toán và xác nhận đơn hàng của bạn
        </DialogDescription>

        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px] md:min-h-[700px]">
          <div className="bg-slate-50 border-r border-slate-200 p-8 md:p-16 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6 md:space-y-8">
              <button
                onClick={() => {
                  if (onBack) onBack()
                  onOpenChange(false)
                }}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Thay đổi gói
              </button>

              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900">Hóa đơn chi tiết</h3>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-slate-200 space-y-4 md:space-y-6">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Dịch vụ</div>
                  <h4 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3">{packageName}</h4>
                  <p className="text-xs md:text-sm text-slate-600">
                    Chu kỳ thanh toán {billingCycle === "monthly" ? "hàng tháng" : "hàng năm"}
                  </p>
                </div>

                <div className="text-3xl md:text-4xl font-bold text-slate-900">
                  ${currentPrice.toFixed(2)}
                  <span className="text-sm md:text-base font-normal text-slate-500 ml-2 md:ml-3">
                    / {billingCycle === "monthly" ? "tháng" : "năm"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4 border-t border-slate-200 pt-4 md:pt-6">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-600">Tạm tính</span>
                  <span className="font-medium text-slate-900">${currentPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-600">Thuế (VAT 10%)</span>
                  <span className="font-medium text-slate-900">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-2xl md:text-3xl font-bold border-t border-slate-200 pt-4 md:pt-6 mt-3 md:mt-4">
                  <span className="text-slate-900">Tổng cộng</span>
                  <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
                </div>

                {billingCycle === "yearly" && (
                  <div className="text-xs text-slate-500 pt-2 md:pt-3">
                    ≈ {convertUSDtoVND(totalPrice).toLocaleString("vi-VN")} đ VND
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mt-4 md:mt-6">
                <p className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-semibold">Lưu ý:</span> Gói dịch vụ sẽ được kích hoạt ngay sau khi thanh toán
                  thành công. Hóa đơn điện tử sẽ được gửi vào email của bạn.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-16 flex flex-col overflow-y-auto bg-white">
            <div className="flex justify-between items-start mb-6 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-4xl font-bold text-slate-900">Thanh toán</h2>
                <p className="text-slate-600 mt-1 md:mt-2 text-sm md:text-base">
                  Lựa chọn phương thức an toàn nhất cho bạn
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-slate-600 text-xl md:text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 md:space-y-5 flex-1">
              <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as "stripe" | "vnpay")}>
                <label className="cursor-pointer">
                  <div
                    className={`border-2 rounded-[1.5rem] p-5 md:p-7 transition-all ${
                      selectedMethod === "stripe"
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-5">
                      <RadioGroupItem value="stripe" id="payment-stripe" className="h-5 w-5 md:h-6 md:w-6" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-base md:text-lg">Thẻ Visa/Mastercard</h4>
                        <p className="text-xs text-slate-600 mt-0.5 md:mt-1 font-medium tracking-widest">
                          XỬ LÝ QUA STRIPE
                        </p>
                      </div>
                      <CreditCard className="h-6 w-6 md:h-9 md:w-9 text-blue-600 flex-shrink-0" />
                    </div>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <div
                    className={`border-2 rounded-[1.5rem] p-5 md:p-7 transition-all ${
                      selectedMethod === "vnpay"
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-5">
                      <RadioGroupItem value="vnpay" id="payment-vnpay" className="h-5 w-5 md:h-6 md:w-6" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-base md:text-lg">Quét mã QR (VietQR)</h4>
                        <p className="text-xs text-slate-600 mt-0.5 md:mt-1 font-medium tracking-widest">
                          NGÂN HÀNG NỘI ĐỊA
                        </p>
                      </div>
                      <QrCode className="h-6 w-6 md:h-9 md:w-9 text-emerald-600 flex-shrink-0" />
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-3 md:space-y-4 pt-6 md:pt-8 border-t border-slate-200 mt-6 md:mt-8">
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full h-16 md:h-20 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold text-base md:text-lg shadow-xl transition-all"
              >
                {loading && <Loader2 className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 animate-spin" />}
                {loading ? "Đang xử lý..." : `Bắt đầu thanh toán → ${formatPrice(totalPrice)}`}
              </Button>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Bằng việc nhấn xác nhận, bạn đồng ý với{" "}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Chính sách hoàn trả
                </a>{" "}
                của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { PaymentCheckoutModal }
export default PaymentCheckoutModal
