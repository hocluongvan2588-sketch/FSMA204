import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, AlertCircle, Users, Building2, Package, HardDrive, TrendingUp, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { redirect } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { BillingPortalButton } from "./billing-portal-button"
import { RecalculateButton } from "./recalculate-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlanBadge } from "@/components/plan-badge" // Import PlanBadge component

export default async function AdminMySubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "system_admin")) {
    redirect("/admin")
  }

  if (!profile.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gói dịch vụ của tôi</h1>
          <p className="text-slate-500 mt-1">Quản lý đăng ký dịch vụ của công ty bạn</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chưa được gán công ty</AlertTitle>
          <AlertDescription>
            Công ty bạn chưa đăng ký gói dịch vụ nào. Vui lòng liên hệ quản trị viên hệ thống để được gán vào công ty.
          </AlertDescription>
        </Alert>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Khám phá các gói dịch vụ</CardTitle>
            <CardDescription className="text-base mt-2">
              Dùng thử 30 ngày miễn phí. Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/pricing">
                Xem tất cả gói dịch vụ
                <ExternalLink className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("[v0] Profile company_id:", profile.company_id)
  console.log("[v0] Profile details:", {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    company_id: profile.company_id,
  })

  // Fetch current subscription
  const { data: activeSubscription, error: activeError } = await supabase
    .from("company_subscriptions")
    .select(`
      *,
      service_packages!inner (
        id,
        name,
        description,
        features,
        limits,
        price_monthly,
        price_yearly,
        display_order
      )
    `)
    .eq("company_id", profile.company_id)
    .eq("status", "active") // Fixed column name from subscription_status to status
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log("[v0] Active subscription query result:", { activeSubscription, activeError })

  const { data: allCompanySubscriptions } = await supabase
    .from("company_subscriptions")
    .select("id, company_id, status, start_date, end_date")
    .eq("company_id", profile.company_id)

  console.log("[v0] ALL subscriptions for company:", allCompanySubscriptions)

  // If no active subscription, check for trial or any subscription
  let finalSubscription = activeSubscription

  if (!finalSubscription) {
    console.log("[v0] No active subscription found, checking for trial or any subscription")
    const { data: anySubscription, error: anyError } = await supabase
      .from("company_subscriptions")
      .select(`
        *,
        service_packages!inner (
          id,
          name,
          description,
          features,
          limits,
          price_monthly,
          price_yearly,
          display_order
        )
      `)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log("[v0] Any subscription query result:", { anySubscription, anyError })
    finalSubscription = anySubscription
  }

  const isFreeplan =
    finalSubscription?.service_packages?.price_monthly === 0 ||
    finalSubscription?.service_packages?.price_monthly === null
  const isExpired =
    finalSubscription && finalSubscription.end_date && new Date(finalSubscription.end_date) < new Date() && !isFreeplan // Free plans never expire

  const getFeaturesList = (pkg: any) => {
    const features = []

    // Read from limits jsonb
    const limits = pkg.limits || {}
    const featureFlags = pkg.features || {}

    if (limits.max_users) features.push(`${limits.max_users} người dùng`)
    if (limits.max_facilities) features.push(`${limits.max_facilities} cơ sở`)
    if (limits.max_products) features.push(`${limits.max_products} sản phẩm`)
    if (limits.max_storage_gb) features.push(`${limits.max_storage_gb} GB dung lượng`)

    if (featureFlags.api_access) features.push("Tạo TLC & QR Codes")
    if (featureFlags.cte_tracking) features.push("CTE Tracking đầy đủ")
    if (featureFlags.kde_management) features.push("Quản lý KDE")
    if (featureFlags.fda_registration) features.push("Quản lý FDA Registration")
    if (featureFlags.agent_management) features.push("Quản lý US Agent")

    return features
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0
    return Math.min(Math.round((current / max) * 100), 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-orange-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gói dịch vụ của tôi</h1>
          <div className="flex items-center gap-3 mt-2">
            {profile?.company_id && <PlanBadge companyId={profile.company_id} variant="default" />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {finalSubscription && <RecalculateButton />}
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/pricing">
              <Package className="h-4 w-4 mr-2" />
              So sánh gói
            </Link>
          </Button>
        </div>
      </div>

      {finalSubscription && isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gói dịch vụ đã hết hạn</AlertTitle>
          <AlertDescription>Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.</AlertDescription>
          <Button asChild size="sm" className="mt-4" variant="destructive">
            <Link href="/admin/pricing">Gia hạn ngay</Link>
          </Button>
        </Alert>
      )}

      {!finalSubscription && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chưa có gói dịch vụ</AlertTitle>
          <AlertDescription>
            Công ty bạn chưa đăng ký gói dịch vụ nào. Vui lòng chọn gói phù hợp bên dưới.
          </AlertDescription>
          <Button asChild size="sm" className="mt-4" variant="destructive">
            <Link href="/admin/pricing">Chọn gói dịch vụ</Link>
          </Button>
        </Alert>
      )}

      {finalSubscription ? (
        <>
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{finalSubscription.service_packages.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {finalSubscription.service_packages.description}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    isExpired
                      ? "destructive"
                      : finalSubscription.status === "active"
                        ? "default"
                        : finalSubscription.status === "trial"
                          ? "secondary"
                          : "outline"
                  }
                  className="text-sm"
                >
                  {isExpired
                    ? "Đã hết hạn"
                    : finalSubscription.status === "active"
                      ? "Đang hoạt động"
                      : finalSubscription.status === "trial"
                        ? "Dùng thử"
                        : "Tạm dừng"}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-6">
                <div>
                  <p className="text-sm text-slate-500">Bắt đầu</p>
                  <p className="text-lg font-semibold">
                    {finalSubscription.start_date
                      ? format(new Date(finalSubscription.start_date), "dd/MM/yyyy", { locale: vi })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {finalSubscription.service_packages?.price_monthly === 0 ? "Hết hạn" : "Gia hạn tiếp theo"}
                  </p>
                  <p className="text-lg font-semibold">
                    {finalSubscription.service_packages?.price_monthly === 0
                      ? "Miễn phí mãi mãi"
                      : finalSubscription.end_date || finalSubscription.next_billing_date
                        ? format(
                            new Date(finalSubscription.end_date || finalSubscription.next_billing_date),
                            "dd/MM/yyyy",
                            { locale: vi },
                          )
                        : "N/A"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    {finalSubscription.service_packages.price_monthly === 0 ? (
                      <>
                        <span className="text-4xl font-bold text-slate-900">Miễn phí</span>
                        <span className="text-slate-600">mãi mãi</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-slate-900">
                          $
                          {finalSubscription.billing_cycle === "monthly"
                            ? finalSubscription.service_packages.price_monthly
                            : finalSubscription.service_packages.price_yearly}
                        </span>
                        <span className="text-slate-600">
                          /{finalSubscription.billing_cycle === "monthly" ? "tháng" : "năm"}
                        </span>
                      </>
                    )}
                  </div>
                  {finalSubscription.billing_cycle === "yearly" &&
                    finalSubscription.service_packages.price_monthly !== 0 && (
                      <p className="text-sm text-green-600 mt-1">Tiết kiệm 17% so với thanh toán hàng tháng</p>
                    )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Chu kỳ thanh toán:</span>
                    <span className="font-medium">
                      {finalSubscription.billing_cycle === "monthly" ? "Hàng tháng" : "Hàng năm"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ngày bắt đầu:</span>
                    <span className="font-medium">
                      {format(new Date(finalSubscription.start_date), "dd/MM/yyyy", { locale: vi })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ngày hết hạn:</span>
                    <span className="font-medium">
                      {format(new Date(finalSubscription.end_date), "dd/MM/yyyy", { locale: vi })}
                    </span>
                  </div>
                  {finalSubscription.trial_end_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dùng thử đến:</span>
                      <span className="font-medium text-blue-600">
                        {format(new Date(finalSubscription.trial_end_date), "dd/MM/yyyy", { locale: vi })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4">Mức sử dụng hiện tại</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Người dùng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getUsageColor(
                      getUsagePercentage(
                        finalSubscription.current_users_count || 0,
                        finalSubscription.service_packages.limits.max_users || 0,
                      ),
                    )}`}
                  >
                    {finalSubscription.current_users_count || 0} /{" "}
                    {finalSubscription.service_packages.limits.max_users === -1
                      ? "∞"
                      : finalSubscription.service_packages.limits.max_users || 0}
                  </div>
                  {finalSubscription.service_packages.limits.max_users !== -1 && (
                    <>
                      <Progress
                        value={getUsagePercentage(
                          finalSubscription.current_users_count || 0,
                          finalSubscription.service_packages.limits.max_users || 0,
                        )}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {getUsagePercentage(
                          finalSubscription.current_users_count || 0,
                          finalSubscription.service_packages.limits.max_users || 0,
                        )}
                        % đã sử dụng
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Cơ sở
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getUsageColor(
                      getUsagePercentage(
                        finalSubscription.current_facilities_count || 0,
                        finalSubscription.service_packages.limits.max_facilities || 0,
                      ),
                    )}`}
                  >
                    {finalSubscription.current_facilities_count || 0} /{" "}
                    {finalSubscription.service_packages.limits.max_facilities === -1
                      ? "∞"
                      : finalSubscription.service_packages.limits.max_facilities || 0}
                  </div>
                  {finalSubscription.service_packages.limits.max_facilities !== -1 && (
                    <>
                      <Progress
                        value={getUsagePercentage(
                          finalSubscription.current_facilities_count || 0,
                          finalSubscription.service_packages.limits.max_facilities || 0,
                        )}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {getUsagePercentage(
                          finalSubscription.current_facilities_count || 0,
                          finalSubscription.service_packages.limits.max_facilities || 0,
                        )}
                        % đã sử dụng
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getUsageColor(
                      getUsagePercentage(
                        finalSubscription.current_products_count || 0,
                        finalSubscription.service_packages.limits.max_products || 0,
                      ),
                    )}`}
                  >
                    {finalSubscription.current_products_count || 0} /{" "}
                    {finalSubscription.service_packages.limits.max_products === -1
                      ? "∞"
                      : finalSubscription.service_packages.limits.max_products || 0}
                  </div>
                  {finalSubscription.service_packages.limits.max_products !== -1 && (
                    <>
                      <Progress
                        value={getUsagePercentage(
                          finalSubscription.current_products_count || 0,
                          finalSubscription.service_packages.limits.max_products || 0,
                        )}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {getUsagePercentage(
                          finalSubscription.current_products_count || 0,
                          finalSubscription.service_packages.limits.max_products || 0,
                        )}
                        % đã sử dụng
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Dung lượng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getUsageColor(
                      getUsagePercentage(
                        finalSubscription.current_storage_gb || 0,
                        finalSubscription.service_packages.limits.max_storage_gb || 0,
                      ),
                    )}`}
                  >
                    {(finalSubscription.current_storage_gb || 0).toFixed(2)} GB /{" "}
                    {finalSubscription.service_packages.limits.max_storage_gb || 0} GB
                  </div>
                  <Progress
                    value={getUsagePercentage(
                      finalSubscription.current_storage_gb || 0,
                      finalSubscription.service_packages.limits.max_storage_gb || 0,
                    )}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {getUsagePercentage(
                      finalSubscription.current_storage_gb || 0,
                      finalSubscription.service_packages.limits.max_storage_gb || 0,
                    )}
                    % đã sử dụng
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tính năng đang sử dụng</CardTitle>
              <CardDescription>
                Các tính năng bao gồm trong gói {finalSubscription.service_packages.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {getFeaturesList(finalSubscription.service_packages).map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="rounded-full bg-green-100 p-1 mt-0.5 flex-shrink-0">
                      <Check className="h-4 w-4 text-green-700" />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quản lý thanh toán</CardTitle>
              <CardDescription>Xem lịch sử thanh toán và cập nhật thông tin thẻ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {finalSubscription.last_payment_date && (
                    <div>
                      Thanh toán gần nhất:{" "}
                      <span className="font-medium text-slate-900">
                        {format(new Date(finalSubscription.last_payment_date), "dd/MM/yyyy", { locale: vi })}
                      </span>
                      {finalSubscription.last_payment_amount && (
                        <span className="ml-2 font-semibold text-green-600">
                          ${finalSubscription.last_payment_amount}
                        </span>
                      )}
                    </div>
                  )}
                  {!finalSubscription.last_payment_date && <div>Chưa có thanh toán nào</div>}
                </div>
                <BillingPortalButton companyId={profile.company_id} />
              </div>
            </CardContent>
          </Card>

          {finalSubscription.service_packages.name !== "Enterprise" && (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">Nâng cấp để mở khóa thêm tính năng</h3>
                      <p className="text-sm text-slate-600">Khám phá các gói cao hơn với nhiều tính năng mạnh mẽ hơn</p>
                    </div>
                  </div>
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/admin/pricing">
                      Xem gói cao hơn
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>{/* No subscription alert */}</>
      )}
    </div>
  )
}
