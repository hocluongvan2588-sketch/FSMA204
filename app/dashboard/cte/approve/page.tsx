import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CTEApprovalActions } from "@/components/cte-approval-actions"
import { redirect } from "next/navigation"

export default async function CTEApprovePage() {
  const supabase = await createClient()

  // Check user role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // Only managers and admins can approve
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch pending CTEs (assuming we add an approval_status field later)
  const { data: ctes } = await supabase
    .from("critical_tracking_events")
    .select(
      "*, traceability_lots(tlc, products(product_name)), facilities(name), profiles!critical_tracking_events_created_by_fkey(full_name)",
    )
    .order("event_date", { ascending: false })

  const pendingCTEs = ctes || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phê duyệt CTE</h1>
          <p className="text-muted-foreground mt-1">Xét duyệt các sự kiện Critical Tracking Events</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {pendingCTEs.length} sự kiện
        </Badge>
      </div>

      {pendingCTEs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Không có CTE cần duyệt</h3>
            <p className="text-muted-foreground">Tất cả sự kiện đã được xử lý</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingCTEs.map((cte) => (
            <Card key={cte.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {cte.event_type === "harvest"
                          ? "Thu hoạch"
                          : cte.event_type === "cooling"
                            ? "Làm lạnh"
                            : cte.event_type === "packing"
                              ? "Đóng gói"
                              : cte.event_type === "receiving"
                                ? "Tiếp nhận"
                                : cte.event_type === "transformation"
                                  ? "Chế biến"
                                  : "Vận chuyển"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(cte.event_date).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      TLC: {cte.traceability_lots?.tlc} - {cte.traceability_lots?.products?.product_name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cte.description && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">{cte.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Cơ sở</p>
                    <p className="font-medium">{cte.facilities?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Người phụ trách</p>
                    <p className="font-medium">{cte.responsible_person}</p>
                  </div>
                  {cte.quantity_processed && (
                    <div>
                      <p className="text-muted-foreground mb-1">Số lượng</p>
                      <p className="font-medium">
                        {cte.quantity_processed} {cte.unit}
                      </p>
                    </div>
                  )}
                  {cte.temperature && (
                    <div>
                      <p className="text-muted-foreground mb-1">Nhiệt độ</p>
                      <p className="font-medium">{cte.temperature}°C</p>
                    </div>
                  )}
                </div>

                {cte.location_details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Địa điểm chi tiết</p>
                    <p className="text-sm">{cte.location_details}</p>
                  </div>
                )}

                <CTEApprovalActions cteId={cte.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
