import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Sparkles, Zap, Rocket, Crown } from "lucide-react"
import Link from "next/link"
import { getAllPlanConfigs, type PlanConfig } from "@/lib/plan-config"
import type { JSX } from "react"
import { createClient } from "@/lib/supabase/server"
import { SubscribeButton } from "@/app/admin/my-subscription/subscribe-button"

export const metadata = {
  title: "Bảng giá | Vexim FSMA 204",
  description: "Lựa chọn gói dịch vụ phù hợp cho doanh nghiệp của bạn. Từ $99/tháng, dùng thử 30 ngày miễn phí.",
}

const getIcon = (code: string) => {
  const icons: Record<string, JSX.Element> = {
    FREE: <Sparkles className="h-6 w-6" />,
    STARTER: <Zap className="h-6 w-6" />,
    PROFESSIONAL: <Rocket className="h-6 w-6" />,
    BUSINESS: <Crown className="h-6 w-6" />,
    ENTERPRISE: <Crown className="h-6 w-6" />,
  }
  return icons[code] || null
}

const renderFeatures = (plan: PlanConfig) => {
  const { limits, features } = plan

  return [
    {
      label: `${limits.users === -1 ? "Không giới hạn" : limits.users} người dùng`,
      included: true,
    },
    {
      label: `${limits.facilities === -1 ? "Không giới hạn" : limits.facilities} cơ sở`,
      included: true,
    },
    {
      label: `${limits.products === -1 ? "Không giới hạn" : limits.products} sản phẩm`,
      included: true,
    },
    {
      label: `${limits.storage_gb} GB dung lượng`,
      included: true,
    },
    { label: "Tạo TLC & QR Codes", included: features.qr_code },
    { label: "CTE Tracking đầy đủ", included: features.cte_tracking },
    { label: "Quản lý KDE", included: features.kde_management },
    { label: "Quản lý FDA Registration", included: features.fda_registration },
    { label: "Quản lý US Agent", included: features.us_agent },
    { label: "Báo cáo FSMA 204", included: features.fsma_204_report },
    { label: "API Access", included: features.api_access },
    { label: "Custom Branding", included: features.custom_branding },
    { label: "Hỗ trợ ưu tiên", included: features.priority_support },
    ...(features.watermark ? [{ label: '⚠️ Có watermark "Powered by Vexim"', included: false }] : []),
  ]
}

export default async function AdminPricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPackageCode: string | null = null
  let userCompanyId: string | null = null

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (profile?.company_id) {
      userCompanyId = profile.company_id
      const { data: subscription } = await supabase
        .from("company_subscriptions")
        .select("service_packages(package_code)")
        .eq("company_id", profile.company_id)
        .eq("subscription_status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subscription?.service_packages) {
        currentPackageCode = subscription.service_packages.package_code
      }
    }
  }

  const plans = await getAllPlanConfigs()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng giá dịch vụ</h1>
          <p className="text-muted-foreground">Chọn gói phù hợp với nhu cầu doanh nghiệp của bạn</p>
        </div>
      </div>

      {/* Trial Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Dùng thử 30 ngày miễn phí</h3>
            <p className="text-sm text-slate-600">
              Không cần thẻ tín dụng. Hủy bất cứ lúc nào. Trải nghiệm đầy đủ tính năng.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      {plans.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPackageCode === plan.plan_code

            return (
              <Card
                key={plan.plan_id}
                className={`relative flex flex-col ${
                  plan.is_featured
                    ? "border-2 border-blue-500 shadow-lg"
                    : isCurrentPlan
                      ? "border-2 border-green-500 shadow-md"
                      : "border-border hover:shadow-md transition-shadow"
                } ${plan.plan_code === "FREE" ? "bg-muted/30" : "bg-card"}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-green-600 to-green-400">Gói hiện tại</Badge>
                  </div>
                )}
                {plan.is_featured && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-400">Phổ biến nhất</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3 text-blue-600">{getIcon(plan.plan_code)}</div>
                  <CardTitle className="text-xl">{plan.name_vi || plan.name}</CardTitle>
                  <CardDescription className="mt-2 min-h-[3rem] flex items-center justify-center text-center text-xs leading-relaxed">
                    {plan.description_vi || plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Price */}
                  <div className="text-center pb-4 border-b">
                    {plan.price_monthly === 0 ? (
                      <div>
                        <span className="text-4xl font-bold">Miễn phí</span>
                        <div className="text-xs text-muted-foreground mt-1">Dùng mãi mãi</div>
                      </div>
                    ) : plan.plan_code === "ENTERPRISE" ? (
                      <div>
                        <div className="text-2xl font-bold">Liên hệ</div>
                        <div className="text-xs text-muted-foreground mt-1">Giá tùy chỉnh</div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-xl text-muted-foreground">$</span>
                          <span className="text-4xl font-bold">{plan.price_monthly}</span>
                          <span className="text-muted-foreground">/tháng</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          hoặc ${plan.price_yearly}/năm{" "}
                          <Badge variant="outline" className="text-xs">
                            -17%
                          </Badge>
                          <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                            ≈ {Math.round(plan.price_monthly * 25000).toLocaleString()} đ VND
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {renderFeatures(plan).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <div className="rounded-full bg-green-100 p-0.5 mt-0.5 shrink-0">
                            <Check className="h-3 w-3 text-green-700" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-muted p-0.5 mt-0.5 shrink-0">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span
                          className={`text-xs ${feature.included ? "text-foreground" : "text-muted-foreground line-through"}`}
                        >
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-4">
                  {isCurrentPlan ? (
                    <Button disabled variant="outline" className="w-full bg-transparent">
                      Gói hiện tại
                    </Button>
                  ) : plan.plan_code === "FREE" ? (
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/auth/signup">Đăng ký miễn phí</Link>
                    </Button>
                  ) : plan.plan_code === "ENTERPRISE" ? (
                    <Button asChild className="w-full">
                      <Link href="/contact">Liên hệ sales</Link>
                    </Button>
                  ) : (
                    <SubscribeButton
                      packageId={plan.plan_id}
                      companyId={userCompanyId || ""}
                      packageName={plan.name_vi || plan.name}
                      monthlyPrice={plan.price_monthly}
                      yearlyPrice={plan.price_yearly}
                    />
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chưa có gói dịch vụ nào. Vui lòng chạy seed script.</p>
        </Card>
      )}

      {/* FAQ Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Câu hỏi thường gặp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Dùng thử 30 ngày có cần thẻ tín dụng không?</h4>
            <p className="text-sm text-muted-foreground">
              Không. Bạn chỉ cần email để đăng ký. Sau 30 ngày, bạn có thể chọn nâng cấp lên gói trả phí hoặc tiếp tục
              dùng gói Free.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Tôi có thể thay đổi gói dịch vụ sau không?</h4>
            <p className="text-sm text-muted-foreground">
              Có. Bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào. Chúng tôi sẽ tính phí theo tỷ lệ thời gian
              sử dụng.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Hình thức thanh toán nào được chấp nhận?</h4>
            <p className="text-sm text-muted-foreground">
              Chúng tôi chấp nhận thẻ tín dụng quốc tế (Visa, Mastercard) qua Stripe, và thanh toán nội địa qua VNPay,
              Momo, ZaloPay cho khách hàng Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Gói Free có giới hạn gì?</h4>
            <p className="text-sm text-muted-foreground">
              Gói Free giới hạn 1 người dùng, 1 cơ sở, 3 sản phẩm và 100MB dung lượng. Tất cả báo cáo sẽ có watermark
              "Powered by Vexim". Không có quản lý FDA và US Agent.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Tôi có thể hủy bất cứ lúc nào không?</h4>
            <p className="text-sm text-muted-foreground">
              Có. Bạn có thể hủy subscription bất cứ lúc nào. Dữ liệu của bạn sẽ được giữ lại trong 90 ngày sau khi hủy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
