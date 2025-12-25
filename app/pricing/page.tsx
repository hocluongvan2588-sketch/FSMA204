import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Sparkles, Zap, Rocket, Crown, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Bảng giá | Vexim FSMA 204",
  description: "Lựa chọn gói dịch vụ phù hợp cho doanh nghiệp của bạn. Từ $99/tháng, dùng thử 30 ngày miễn phí.",
}

export default async function PricingPage() {
  const supabase = await createClient()

  // Fetch active packages
  const { data: packages } = await supabase
    .from("service_packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const getIcon = (code: string) => {
    switch (code) {
      case "FREE":
        return <Sparkles className="h-6 w-6" />
      case "STARTER":
        return <Zap className="h-6 w-6" />
      case "PROFESSIONAL":
        return <Rocket className="h-6 w-6" />
      case "BUSINESS":
        return <Crown className="h-6 w-6" />
      case "ENTERPRISE":
        return <Crown className="h-6 w-6" />
      default:
        return null
    }
  }

  const getFeatures = (pkg: any) => {
    const features = [
      {
        label: `${pkg.max_users === -1 ? "Không giới hạn" : pkg.max_users} người dùng`,
        included: true,
      },
      {
        label: `${pkg.max_facilities === -1 ? "Không giới hạn" : pkg.max_facilities} cơ sở`,
        included: true,
      },
      {
        label: `${pkg.max_products === -1 ? "Không giới hạn" : pkg.max_products} sản phẩm`,
        included: true,
      },
      {
        label: `${pkg.max_storage_gb} GB dung lượng`,
        included: true,
      },
      {
        label: "Tạo TLC & QR Codes",
        included: true,
      },
      {
        label: "CTE Tracking đầy đủ",
        included: pkg.includes_cte_tracking,
      },
      {
        label: "Quản lý KDE",
        included: true,
      },
      {
        label: "Quản lý FDA Registration",
        included: pkg.includes_fda_management,
      },
      {
        label: "Quản lý US Agent",
        included: pkg.includes_agent_management,
      },
      {
        label: "Báo cáo FSMA 204",
        included: pkg.includes_reporting,
      },
      {
        label: "API Access",
        included: pkg.includes_api_access,
      },
      {
        label: "Custom Branding",
        included: pkg.includes_custom_branding,
      },
      {
        label: "Hỗ trợ ưu tiên",
        included: pkg.includes_priority_support,
      },
    ]

    if (pkg.package_code === "FREE") {
      features.push({
        label: '⚠️ Có watermark "Powered by Vexim"',
        included: false,
      })
    }

    return features
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 pt-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-green-600">FSMA 204 Compliance</Badge>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 text-balance">
            Chọn gói phù hợp với
            <br />
            doanh nghiệp của bạn
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Dùng thử <strong>30 ngày miễn phí</strong>. Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
          </p>
        </div>

        {/* Pricing Cards */}
        {packages && packages.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
            {packages.map((pkg: any) => (
              <Card
                key={pkg.id}
                className={`relative flex flex-col ${
                  pkg.is_featured
                    ? "border-2 border-blue-500 shadow-xl scale-105 z-10"
                    : "border-slate-200 hover:shadow-lg transition-all"
                } ${pkg.package_code === "FREE" ? "bg-slate-50" : "bg-white"}`}
              >
                {pkg.is_featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-400 px-4 py-1">Phổ biến nhất</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3 text-blue-600">{getIcon(pkg.package_code)}</div>
                  <CardTitle className="text-2xl">{pkg.package_name_vi || pkg.package_name}</CardTitle>
                  <CardDescription className="mt-2 min-h-[48px]">
                    {pkg.description_vi || pkg.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  {/* Price */}
                  <div className="text-center mb-6 pb-6 border-b">
                    {pkg.price_monthly === 0 ? (
                      <div>
                        <span className="text-5xl font-bold text-slate-900">Free</span>
                        <div className="text-sm text-slate-500 mt-2">Miễn phí mãi mãi</div>
                      </div>
                    ) : pkg.package_code === "ENTERPRISE" ? (
                      <div>
                        <div className="text-3xl font-bold text-slate-900">Liên hệ</div>
                        <div className="text-sm text-slate-500 mt-2">Giá tùy chỉnh</div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-2xl text-slate-600">$</span>
                          <span className="text-5xl font-bold text-slate-900">{pkg.price_monthly}</span>
                          <span className="text-slate-600">/tháng</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-2">
                          hoặc ${pkg.price_yearly}/năm{" "}
                          <Badge variant="outline" className="ml-1 text-xs">
                            -17%
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">≈ {Math.round(pkg.price_monthly * 25)} K VND</div>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {getFeatures(pkg).map((feature: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <div className="rounded-full bg-green-100 p-0.5 mt-0.5 flex-shrink-0">
                            <Check className="h-3 w-3 text-green-700" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-slate-100 p-0.5 mt-0.5 flex-shrink-0">
                            <X className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                        <span
                          className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400 line-through"}`}
                        >
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-6">
                  {pkg.package_code === "FREE" ? (
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/auth/signup">Đăng ký miễn phí</Link>
                    </Button>
                  ) : pkg.package_code === "ENTERPRISE" ? (
                    <Button asChild variant="default" className="w-full">
                      <Link href="/contact">Liên hệ sales</Link>
                    </Button>
                  ) : (
                    <Button asChild className={pkg.is_featured ? "w-full bg-blue-600 hover:bg-blue-700" : "w-full"}>
                      <Link href="/auth/signup?redirect=/admin/my-subscription">Dùng thử 30 ngày</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Câu hỏi thường gặp</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Dùng thử 30 ngày có cần thẻ tín dụng không?</h3>
              <p className="text-slate-600">
                Không. Bạn chỉ cần email để đăng ký. Sau 30 ngày, bạn có thể chọn nâng cấp lên gói trả phí hoặc tiếp tục
                dùng gói Free.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tôi có thể thay đổi gói dịch vụ sau không?</h3>
              <p className="text-slate-600">
                Có. Bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào. Chúng tôi sẽ tính phí theo tỷ lệ thời
                gian sử dụng.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Hình thức thanh toán nào được chấp nhận?</h3>
              <p className="text-slate-600">
                Chúng tôi chấp nhận thẻ tín dụng quốc tế (Visa, Mastercard) qua Stripe, và thanh toán nội địa qua VNPay,
                Momo, ZaloPay cho khách hàng Việt Nam.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Gói Free có giới hạn gì?</h3>
              <p className="text-slate-600">
                Gói Free giới hạn 1 người dùng, 1 cơ sở, 3 sản phẩm và 100MB dung lượng. Tất cả báo cáo sẽ có watermark
                "Powered by Vexim". Không có quản lý FDA và US Agent.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tôi có thể hủy bất cứ lúc nào không?</h3>
              <p className="text-slate-600">
                Có. Bạn có thể hủy subscription bất cứ lúc nào. Dữ liệu của bạn sẽ được giữ lại trong 90 ngày sau khi
                hủy.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng tuân thủ FSMA 204?</h2>
          <p className="text-xl mb-8 text-blue-50">
            Hạn chót FSMA 204: <strong>20/01/2026</strong>. Chỉ còn 12 tháng!
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-slate-100">
            <Link href="/auth/signup?redirect=/admin/my-subscription">Bắt đầu dùng thử 30 ngày miễn phí</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
