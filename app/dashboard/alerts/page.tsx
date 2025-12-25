import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, XCircle, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function AlertsPage() {
  const supabase = await createClient()

  // Fetch all data quality alerts
  const { data: alerts } = await supabase
    .from("data_quality_alerts")
    .select(
      `
      *,
      traceability_lots(tlc, products(product_name)),
      critical_tracking_events(event_type, event_date, facilities(name))
    `,
    )
    .order("created_at", { ascending: false })

  const criticalAlerts = alerts?.filter((a) => a.severity === "critical") || []
  const warningAlerts = alerts?.filter((a) => a.severity === "warning") || []
  const infoAlerts = alerts?.filter((a) => a.severity === "info") || []

  const severityConfig = {
    critical: {
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badge: "destructive",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      badge: "default",
    },
    info: {
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badge: "secondary",
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cảnh báo chất lượng dữ liệu</h1>
          <p className="text-slate-500 mt-1">Theo dõi và xử lý các vấn đề về dữ liệu FSMA 204</p>
        </div>
        <Button variant="outline" className="bg-transparent" asChild>
          <Link href="/dashboard/data-quality">Kiểm tra chất lượng</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{criticalAlerts.length}</p>
                <p className="text-sm text-slate-500">Nghiêm trọng</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{warningAlerts.length}</p>
                <p className="text-sm text-slate-500">Cảnh báo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{infoAlerts.length}</p>
                <p className="text-sm text-slate-500">Thông tin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách cảnh báo</CardTitle>
        </CardHeader>
        <CardContent>
          {!alerts || alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Không có cảnh báo</h3>
              <p className="text-slate-500">Dữ liệu của bạn đang tuân thủ đầy đủ FSMA 204</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity as keyof typeof severityConfig]
                const Icon = config.icon

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} flex items-start gap-4`}
                  >
                    <Icon className={`h-5 w-5 ${config.color} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={config.badge as any} className="capitalize">
                          {alert.alert_type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(alert.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 mb-1">{alert.message}</p>
                      {alert.traceability_lots && (
                        <p className="text-sm text-slate-600">
                          TLC: {alert.traceability_lots.tlc} - {alert.traceability_lots.products?.product_name}
                        </p>
                      )}
                      {alert.critical_tracking_events && (
                        <p className="text-sm text-slate-600">
                          CTE: {alert.critical_tracking_events.event_type} tại{" "}
                          {alert.critical_tracking_events.facilities?.name}
                        </p>
                      )}
                      {alert.resolution_suggestion && (
                        <p className="text-sm text-slate-700 mt-2 italic">Đề xuất: {alert.resolution_suggestion}</p>
                      )}
                    </div>
                    {alert.tlc_id && (
                      <Button size="sm" variant="outline" className="shrink-0 bg-white" asChild>
                        <Link href={`/dashboard/lots/${alert.tlc_id}`}>Xem</Link>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
