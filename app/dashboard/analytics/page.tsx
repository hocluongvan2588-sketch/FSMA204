import { AnalyticsCard } from "@/components/analytics-card"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getComplianceMetrics,
  getDashboardAnalytics,
  getFacilityPerformance,
  getLotsTimeSeries,
  getProductTraceability,
  getShipmentTimeSeries,
} from "@/lib/utils/analytics"
import { Activity, AlertTriangle, BarChart3, CheckCircle, Package, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function AnalyticsPage() {
  const [analytics, lotsTimeSeries, shipmentsTimeSeries, compliance, facilityPerf, productTrace] = await Promise.all([
    getDashboardAnalytics(),
    getLotsTimeSeries(30),
    getShipmentTimeSeries(30),
    getComplianceMetrics(),
    getFacilityPerformance(),
    getProductTraceability(),
  ])

  const complianceData = [
    { name: "Tuân thủ", value: compliance.compliant },
    { name: "Không tuân thủ", value: compliance.nonCompliant },
    { name: "Cần hành động", value: compliance.requiresAction },
  ]

  const facilityChartData = facilityPerf.slice(0, 5).map((f) => ({
    name: f.facilityName.length > 15 ? f.facilityName.slice(0, 15) + "..." : f.facilityName,
    value: f.complianceRate,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Phân tích & Báo cáo</h1>
          <p className="text-slate-500 mt-1">Tổng quan hiệu suất và tuân thủ</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports/generate">Tạo báo cáo chi tiết</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Tổng sản phẩm"
          value={analytics.totalProducts}
          icon={Package}
          description="Đang được theo dõi"
        />
        <AnalyticsCard
          title="Tổng lô hàng"
          value={analytics.totalLots}
          icon={BarChart3}
          description={`${analytics.recentActivity} lô trong 7 ngày qua`}
        />
        <AnalyticsCard
          title="Tỷ lệ tuân thủ"
          value={`${compliance.rate.toFixed(1)}%`}
          icon={CheckCircle}
          description={`${compliance.compliant}/${compliance.compliant + compliance.nonCompliant + compliance.requiresAction} báo cáo`}
          className={compliance.rate >= 90 ? "border-green-200 bg-green-50" : ""}
        />
        <AnalyticsCard
          title="Cảnh báo"
          value={analytics.criticalLots}
          icon={AlertTriangle}
          description="Lô thiếu dữ liệu"
          className={analytics.criticalLots > 0 ? "border-orange-200 bg-orange-50" : ""}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LineChart title="Xu hướng tạo lô (30 ngày)" data={lotsTimeSeries} color="#2563eb" />
        <LineChart title="Xu hướng xuất hàng (30 ngày)" data={shipmentsTimeSeries} color="#16a34a" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PieChart title="Trạng thái tuân thủ" data={complianceData} colors={["#22c55e", "#ef4444", "#f59e0b"]} />
        <BarChart title="Hiệu suất cơ sở (Top 5)" data={facilityChartData} color="#8b5cf6" valueLabel="%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hiệu suất theo cơ sở</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {facilityPerf.slice(0, 5).map((facility) => (
                <div key={facility.facilityId} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{facility.facilityName}</p>
                    <p className="text-xs text-slate-500">
                      {facility.totalLots} lô - {facility.issues} vấn đề
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">{facility.complianceRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${facility.complianceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Truy xuất nguồn gốc sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productTrace.slice(0, 5).map((product) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.productName}</p>
                    <p className="text-xs text-slate-500">{product.totalLots} lô</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.missingData > 0 ? (
                      <span className="text-xs text-orange-600 font-medium">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {product.missingData} thiếu
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Đầy đủ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Cơ sở hoạt động</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{analytics.totalFacilities}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Chuyến hàng</span>
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{analytics.totalShipments}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Hoạt động tuần này</span>
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{analytics.recentActivity}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
