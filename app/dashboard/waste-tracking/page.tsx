import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Activity } from "lucide-react"
import { hasFeatureAccess } from "@/lib/plan-config"

export default async function WasteTrackingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile?.company_id) redirect("/dashboard")

  const hasAccess = await hasFeatureAccess(profile.company_id, "waste_tracking")
  if (!hasAccess) {
    redirect("/admin/pricing?feature=waste_tracking")
  }

  // Query waste tracking data from view created in Month 2
  const { data: wasteData } = await supabase
    .from("waste_tracking_summary")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("transformation_date", { ascending: false })
    .limit(50)

  // Calculate metrics
  const totalWaste = wasteData?.reduce((sum, item) => sum + (item.actual_waste_quantity || 0), 0) || 0
  const avgWastePercent = wasteData?.length
    ? wasteData.reduce((sum, item) => sum + (item.waste_percentage || 0), 0) / wasteData.length
    : 0

  const highWasteItems = wasteData?.filter((item) => (item.waste_percentage || 0) > 15) || []

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Waste Tracking Dashboard</h1>
        <p className="text-slate-600">Monitor transformation waste and processing loss - FSMA 204 Compliant</p>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Waste (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalWaste.toFixed(2)} kg</div>
            <p className="text-xs text-slate-500 mt-1">Across {wasteData?.length || 0} transformations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Waste %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700">{avgWastePercent.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Industry standard: 10-15%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">High Waste Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{highWasteItems.length}</div>
            <p className="text-xs text-slate-500 mt-1">Transformations exceeding 15% waste</p>
          </CardContent>
        </Card>
      </div>

      {/* Waste Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transformation Waste</CardTitle>
          <CardDescription>Detailed waste tracking for FDA audit compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Product</th>
                  <th className="text-right p-3 text-sm font-medium">Input</th>
                  <th className="text-right p-3 text-sm font-medium">Output</th>
                  <th className="text-right p-3 text-sm font-medium">Waste</th>
                  <th className="text-right p-3 text-sm font-medium">Waste %</th>
                  <th className="text-left p-3 text-sm font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {wasteData?.map((item, idx) => {
                  const wastePercent = item.waste_percentage || 0
                  const isHigh = wastePercent > 15
                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-3 text-sm">{new Date(item.transformation_date).toLocaleDateString()}</td>
                      <td className="p-3 text-sm font-medium">{item.product_name}</td>
                      <td className="p-3 text-sm text-right">{item.total_input_quantity?.toFixed(2)}</td>
                      <td className="p-3 text-sm text-right">{item.output_quantity?.toFixed(2)}</td>
                      <td className="p-3 text-sm text-right font-medium text-orange-600">
                        {item.actual_waste_quantity?.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={isHigh ? "destructive" : "secondary"}>
                          {isHigh && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {wastePercent.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{item.waste_reason || "Normal processing"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(!wasteData || wasteData.length === 0) && (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No waste tracking data available</p>
              <p className="text-sm mt-1">Waste data will appear after transformation events are recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
