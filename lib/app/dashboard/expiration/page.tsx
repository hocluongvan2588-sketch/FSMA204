import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"
import { hasFeatureAccess } from "@/lib/plan-config"

export default async function ExpirationMonitoringPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile?.company_id) redirect("/dashboard")

  const hasAccess = await hasFeatureAccess(profile.company_id, "expiration_monitoring")
  if (!hasAccess) {
    redirect("/admin/pricing?feature=expiration_monitoring")
  }

  // Query expiration data from view created in Month 2
  const { data: expirationData } = await supabase
    .from("expiration_monitoring")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("days_until_expiry", { ascending: true })
    .limit(100)

  // Categorize by status
  const expired = expirationData?.filter((item) => item.expiration_status === "expired") || []
  const expiringSoon = expirationData?.filter((item) => item.expiration_status === "expiring_soon") || []
  const monitor = expirationData?.filter((item) => item.expiration_status === "monitor") || []
  const good = expirationData?.filter((item) => item.expiration_status === "good") || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "expired":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "expiring_soon":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "monitor":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "expiring_soon":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Expiring Soon</Badge>
      case "monitor":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Monitor</Badge>
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Good</Badge>
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Expiration Monitoring</h1>
        <p className="text-slate-600">Track product shelf life and expiration dates - FDA Requirement (FSMA 204.4)</p>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{expired.length}</div>
            <p className="text-xs text-red-700 mt-1">⚠️ Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{expiringSoon.length}</div>
            <p className="text-xs text-orange-700 mt-1">Within 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{monitor.length}</div>
            <p className="text-xs text-yellow-700 mt-1">8-30 days remaining</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Good
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{good.length}</div>
            <p className="text-xs text-emerald-700 mt-1">Over 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Expiration Status</CardTitle>
          <CardDescription>Sorted by urgency (expiring soonest first)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">TLC</th>
                  <th className="text-left p-3 text-sm font-medium">Product</th>
                  <th className="text-left p-3 text-sm font-medium">Production Date</th>
                  <th className="text-left p-3 text-sm font-medium">Expiry Date</th>
                  <th className="text-right p-3 text-sm font-medium">Days Remaining</th>
                  <th className="text-right p-3 text-sm font-medium">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {expirationData?.map((item, idx) => (
                  <tr key={idx} className="border-t hover:bg-slate-50">
                    <td className="p-3">{getStatusBadge(item.expiration_status)}</td>
                    <td className="p-3 text-sm font-mono">{item.tlc}</td>
                    <td className="p-3 text-sm font-medium">{item.product_name}</td>
                    <td className="p-3 text-sm">{new Date(item.production_date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">{new Date(item.expiry_date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm text-right">
                      {item.days_until_expiry > 0 ? item.days_until_expiry : 0} days
                    </td>
                    <td className="p-3 text-sm text-right">{item.quantity?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!expirationData || expirationData.length === 0) && (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No expiration data available</p>
              <p className="text-sm mt-1">Expiration monitoring requires products with shelf_life_days configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
