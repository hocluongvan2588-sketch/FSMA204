import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FacilityUpdateRequestActions } from "@/components/facility-update-request-actions"
import { Clock, Building2, User } from "lucide-react"

export default async function FacilityRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "system_admin") {
    redirect("/dashboard")
  }

  const { data: requests } = await supabase
    .from("facility_update_requests")
    .select(
      `
      *,
      facilities(id, name, location_code, company_id, companies(name)),
      profiles!facility_update_requests_requested_by_fkey(full_name, email)
    `,
    )
    .eq("request_status", "pending")
    .order("created_at", { ascending: false })

  const pendingRequests = requests || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu Cập nhật Cơ sở</h1>
          <p className="text-muted-foreground mt-1">Xét duyệt các yêu cầu thay đổi thông tin từ Admin công ty</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {pendingRequests.length} yêu cầu
        </Badge>
      </div>

      {pendingRequests.length === 0 ? (
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
            <h3 className="text-lg font-semibold mb-2">Không có yêu cầu cần duyệt</h3>
            <p className="text-muted-foreground">Tất cả yêu cầu đã được xử lý</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Đang chờ
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {request.facilities?.name} ({request.facilities?.location_code})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{request.facilities?.companies?.name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Người yêu cầu: {request.profiles?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{request.profiles?.email}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Các thay đổi đề xuất:</p>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">{JSON.stringify(request.requested_changes, null, 2)}</pre>
                  </div>
                </div>

                <FacilityUpdateRequestActions requestId={request.id} facilityName={request.facilities?.name} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
