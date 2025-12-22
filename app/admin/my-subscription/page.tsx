import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, CreditCard, AlertCircle, Users, Building2, Package, HardDrive } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { redirect } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { SubscribeButton } from "./subscribe-button"
import { BillingPortalButton } from "./billing-portal-button"
import { RecalculateButton } from "./recalculate-button"

export default async function AdminMySubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "admin" || !profile?.company_id) {
    redirect("/admin")
  }

  // Fetch current subscription
  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("*, service_packages(*)")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Fetch available packages
  const { data: packages } = await supabase
    .from("service_packages")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true })

  const getFeaturesList = (pkg: any) => {
    const features = []
    features.push(`${pkg.max_users === -1 ? "Không giới hạn" : pkg.max_users} người dùng`)
    features.push(`${pkg.max_facilities === -1 ? "Không giới hạn" : pkg.max_facilities} cơ sở`)
    features.push(`${pkg.max_products === -1 ? "Không giới hạn" : pkg.max_products} sản phẩm`)
    features.push(`${pkg.max_storage_gb} GB dung lượng`)

    if (pkg.feature_fda) features.push("Đăng ký FDA")
    if (pkg.feature_agent) features.push("US Agent Service")
    if (pkg.feature_cte) features.push("CTE Tracking")
    if (pkg.feature_reporting) features.push("Báo cáo nâng cao")
    if (pkg.feature_api) features.push("API Access")
    if (pkg.feature_branding) features.push("Custom Branding")

    return features
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0 // Unlimited
    return Math.min(Math.round((current / max) * 100), 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gói dịch vụ của tôi</h1>
          <p className="text-slate-500 mt-1">Quản lý đăng ký dịch vụ của công ty bạn</p>
        </div>
        {subscription && <RecalculateButton />}
      </div>

      {subscription ? (
        <>
          <Alert className="border-blue-200 bg-blue-50">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Gói dịch vụ hiện tại</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="font-medium text-lg">{subscription.service_packages.package_name}</span>
                  <span className="ml-4 text-sm">
                    Hết hạn: {format(new Date(subscription.end_date), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
                <Badge
                  className={
                    subscription.subscription_status === "active"
                      ? "bg-green-600"
                      : subscription.subscription_status === "trial"
                        ? "bg-blue-600"
                        : "bg-red-600"
                  }
                >
                  {subscription.subscription_status === "active"
                    ? "Đang hoạt động"
                    : subscription.subscription_status === "trial"
                      ? "Dùng thử"
                      : "Hết hạn"}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Người dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.current_users_count} /{" "}
                  {subscription.service_packages.max_users === -1 ? "∞" : subscription.service_packages.max_users}
                </div>
                {subscription.service_packages.max_users !== -1 && (
                  <Progress
                    value={getUsagePercentage(
                      subscription.current_users_count,
                      subscription.service_packages.max_users,
                    )}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cơ sở
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.current_facilities_count} /{" "}
                  {subscription.service_packages.max_facilities === -1
                    ? "∞"
                    : subscription.service_packages.max_facilities}
                </div>
                {subscription.service_packages.max_facilities !== -1 && (
                  <Progress
                    value={getUsagePercentage(
                      subscription.current_facilities_count,
                      subscription.service_packages.max_facilities,
                    )}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.current_products_count} /{" "}
                  {subscription.service_packages.max_products === -1 ? "∞" : subscription.service_packages.max_products}
                </div>
                {subscription.service_packages.max_products !== -1 && (
                  <Progress
                    value={getUsagePercentage(
                      subscription.current_products_count,
                      subscription.service_packages.max_products,
                    )}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Dung lượng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.current_storage_gb} / {subscription.service_packages.max_storage_gb} GB
                </div>
                <Progress
                  value={getUsagePercentage(
                    subscription.current_storage_gb,
                    subscription.service_packages.max_storage_gb,
                  )}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
              <CardDescription>Chi tiết về gói dịch vụ đang sử dụng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-lg mb-4">{subscription.service_packages.package_name}</h3>
                  <p className="text-slate-600 mb-4">{subscription.service_packages.description}</p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-slate-900">
                      $
                      {subscription.billing_cycle === "monthly"
                        ? subscription.service_packages.price_monthly
                        : subscription.service_packages.price_yearly}
                    </span>
                    <span className="text-slate-600">
                      /{subscription.billing_cycle === "monthly" ? "tháng" : "năm"}
                    </span>
                  </div>
                </div>

                <div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Trạng thái</dt>
                      <dd className="mt-1">
                        <Badge
                          className={
                            subscription.subscription_status === "active"
                              ? "bg-green-600"
                              : subscription.subscription_status === "trial"
                                ? "bg-blue-600"
                                : "bg-red-600"
                          }
                        >
                          {subscription.subscription_status === "active"
                            ? "Đang hoạt động"
                            : subscription.subscription_status === "trial"
                              ? "Dùng thử"
                              : "Hết hạn"}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Chu kỳ thanh toán</dt>
                      <dd className="mt-1 text-slate-900">
                        {subscription.billing_cycle === "monthly" ? "Hàng tháng" : "Hàng năm"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Ngày bắt đầu</dt>
                      <dd className="mt-1 text-slate-900">
                        {format(new Date(subscription.start_date), "dd/MM/yyyy", { locale: vi })}
                      </dd>
                    </div>
                    {subscription.trial_end_date && (
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Ngày kết thúc dùng thử</dt>
                        <dd className="mt-1 text-slate-900">
                          {format(new Date(subscription.trial_end_date), "dd/MM/yyyy", { locale: vi })}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Ngày hết hạn</dt>
                      <dd className="mt-1 text-slate-900">
                        {format(new Date(subscription.end_date), "dd/MM/yyyy", { locale: vi })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold mb-4">Các tính năng bao gồm:</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {getFeaturesList(subscription.service_packages).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="rounded-full bg-green-100 p-1 mt-0.5">
                        <Check className="h-4 w-4 text-green-700" />
                      </div>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  {subscription.last_payment_date && (
                    <div>
                      Thanh toán gần nhất:{" "}
                      {format(new Date(subscription.last_payment_date), "dd/MM/yyyy", { locale: vi })}
                      {subscription.last_payment_amount && ` - $${subscription.last_payment_amount}`}
                    </div>
                  )}
                </div>
                <BillingPortalButton companyId={profile.company_id} />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chưa có gói dịch vụ</AlertTitle>
            <AlertDescription>
              Công ty bạn chưa đăng ký gói dịch vụ nào. Vui lòng chọn gói phù hợp bên dưới.
            </AlertDescription>
          </Alert>

          {packages && packages.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg: any) => (
                <Card
                  key={pkg.id}
                  className={pkg.is_featured ? "border-2 border-blue-500 relative" : "hover:shadow-lg transition-all"}
                >
                  {pkg.is_featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600">Phổ biến nhất</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <Badge variant="outline" className="w-fit mx-auto mb-3">
                      {pkg.package_code}
                    </Badge>
                    <CardTitle className="text-xl">{pkg.package_name}</CardTitle>
                    <CardDescription className="mt-2">{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6 pb-6 border-b">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-slate-900">${pkg.price_monthly}</span>
                        <span className="text-slate-600">/tháng</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        hoặc ${pkg.price_yearly}/năm (tiết kiệm{" "}
                        {Math.round((1 - pkg.price_yearly / (pkg.price_monthly * 12)) * 100)}%)
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {getFeaturesList(pkg)
                        .slice(0, 6)
                        .map((feature: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </div>
                        ))}
                    </div>

                    <SubscribeButton packageId={pkg.id} companyId={profile.company_id} packageName={pkg.package_name} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
