import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, FileText, Download } from "lucide-react"

export default async function ReconciliationPage() {
  const supabase = await createClient()

  const { data: transformationRecords } = await supabase
    .from("critical_tracking_events")
    .select(`
      id,
      event_date,
      traceability_lots(tlc, products(product_name)),
      transformation_inputs(
        input_lot_id,
        quantity,
        waste_percentage,
        traceability_lots(tlc)
      ),
      key_data_elements(kde_key, kde_value)
    `)
    .eq("event_type", "transformation")
    .order("event_date", { ascending: false })
    .limit(50)

  const { data: shippingRecords } = await supabase
    .from("critical_tracking_events")
    .select(`
      id,
      event_date,
      traceability_lot_id,
      traceability_lots(tlc, quantity, products(product_name)),
      key_data_elements(kde_key, kde_value)
    `)
    .eq("event_type", "shipping")
    .order("event_date", { ascending: false })
    .limit(50)

  const transformationIssues = (transformationRecords || []).map((record) => {
    const inputQty = record.transformation_inputs?.reduce((sum, input) => sum + (input.quantity || 0), 0) || 0

    const outputQty = Number.parseFloat(
      record.key_data_elements?.find((k: any) => k.kde_key === "output_quantity")?.kde_value || "0",
    )

    const wastePercent = record.transformation_inputs?.[0]?.waste_percentage || 5
    const expectedOutput = inputQty * (1 - wastePercent / 100)
    const difference = Math.abs(outputQty - expectedOutput)
    const isValid = difference < expectedOutput * 0.05 // 5% tolerance

    return {
      id: record.id,
      tlc: record.traceability_lots?.tlc,
      product: record.traceability_lots?.products?.product_name,
      date: record.event_date,
      inputQty,
      outputQty,
      expectedOutput,
      difference,
      isValid,
    }
  })

  const shippingIssues = (shippingRecords || []).map((record) => {
    const shippedQty = Number.parseFloat(
      record.key_data_elements?.find((k: any) => k.kde_key === "quantity")?.kde_value || "0",
    )
    const availableQty = record.traceability_lots?.quantity || 0
    const isValid = shippedQty <= availableQty

    return {
      id: record.id,
      tlc: record.traceability_lots?.tlc,
      product: record.traceability_lots?.products?.product_name,
      date: record.event_date,
      shippedQty,
      availableQty,
      difference: availableQty - shippedQty,
      isValid,
    }
  })

  const totalTransformationIssues = transformationIssues.filter((i) => !i.isValid).length
  const totalShippingIssues = shippingIssues.filter((i) => !i.isValid).length
  const totalIssues = totalTransformationIssues + totalShippingIssues

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Báo cáo Đối soát Hàng loạt</h1>
          <p className="text-muted-foreground mt-1">Kiểm tra tính nhất quán của số liệu Transformation và Shipping</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700">
          <Download className="h-4 w-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng quan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {transformationRecords?.length || 0 + shippingRecords?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tổng bản ghi</p>
          </CardContent>
        </Card>

        <Card
          className={`rounded-3xl ${totalIssues > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vấn đề</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalIssues > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {totalIssues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Không khớp</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transformation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{totalTransformationIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Input/Output không khớp</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalShippingIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Vượt tồn kho</p>
          </CardContent>
        </Card>
      </div>

      {/* Transformation Reconciliation */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Đối soát Transformation (Input vs Output)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold">TLC</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Sản phẩm</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Ngày</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Input (kg)</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Output (kg)</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Dự kiến (kg)</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Chênh lệch</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transformationIssues.map((issue) => (
                  <tr key={issue.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium">{issue.tlc}</td>
                    <td className="py-3 px-4 text-sm">{issue.product}</td>
                    <td className="py-3 px-4 text-sm">{new Date(issue.date).toLocaleDateString("vi-VN")}</td>
                    <td className="py-3 px-4 text-sm text-right">{issue.inputQty.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right">{issue.outputQty.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right">{issue.expectedOutput.toFixed(2)}</td>
                    <td
                      className={`py-3 px-4 text-sm text-right font-medium ${
                        issue.isValid ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {issue.difference.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {issue.isValid ? (
                        <Badge className="bg-emerald-100 text-emerald-700 rounded-lg">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hợp lệ
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-lg">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Không khớp
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Reconciliation */}
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Đối soát Shipping (Tồn kho vs Xuất hàng)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold">TLC</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Sản phẩm</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Ngày</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Tồn kho (kg)</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Xuất (kg)</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Còn lại</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {shippingIssues.map((issue) => (
                  <tr key={issue.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium">{issue.tlc}</td>
                    <td className="py-3 px-4 text-sm">{issue.product}</td>
                    <td className="py-3 px-4 text-sm">{new Date(issue.date).toLocaleDateString("vi-VN")}</td>
                    <td className="py-3 px-4 text-sm text-right">{issue.availableQty.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right">{issue.shippedQty.toFixed(2)}</td>
                    <td
                      className={`py-3 px-4 text-sm text-right font-medium ${
                        issue.isValid ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {issue.difference.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {issue.isValid ? (
                        <Badge className="bg-emerald-100 text-emerald-700 rounded-lg">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hợp lệ
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-lg">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Vượt tồn
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
