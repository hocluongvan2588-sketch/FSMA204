"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, TrendingUp, TrendingDown, Trash2, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface WasteMetrics {
  transformation_id: string
  transformation_date: string
  product_name: string
  total_input_quantity: number
  total_output_quantity: number
  weighted_waste_percentage: number
  actual_waste_quantity: number
  waste_variance: number
  waste_reason: string | null
}

export function WasteDashboardWidget() {
  const [wasteData, setWasteData] = useState<WasteMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalWaste: 0,
    averageWastePercentage: 0,
    highWasteTransformations: 0,
    trend: "stable" as "up" | "down" | "stable",
  })

  useEffect(() => {
    loadWasteData()
  }, [])

  const loadWasteData = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("waste_tracking_summary")
        .select("*")
        .order("transformation_date", { ascending: false })
        .limit(10)

      if (error) throw error

      setWasteData(data || [])

      // Calculate summary metrics
      if (data && data.length > 0) {
        const totalWaste = data.reduce((sum, item) => sum + (item.actual_waste_quantity || 0), 0)
        const avgWaste = data.reduce((sum, item) => sum + (item.weighted_waste_percentage || 0), 0) / data.length
        const highWaste = data.filter((item) => (item.weighted_waste_percentage || 0) > 10).length

        setSummary({
          totalWaste: totalWaste,
          averageWastePercentage: avgWaste,
          highWasteTransformations: highWaste,
          trend: avgWaste > 8 ? "up" : avgWaste < 5 ? "down" : "stable",
        })
      }
    } catch (err) {
      console.error("[v0] Waste data load error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            <CardTitle>Waste Tracking</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Theo dõi tỷ lệ hao hụt trong quá trình transformation. FDA yêu cầu tracking waste để đảm bảo food
                  safety và compliance.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Tổng quan về waste trong transformation events (FSMA 204 compliance)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <p className="text-xs text-muted-foreground mb-1">Total Waste</p>
            <p className="text-2xl font-bold text-orange-600">
              {summary.totalWaste.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <p className="text-xs text-muted-foreground mb-1">Avg Waste %</p>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-orange-600">{summary.averageWastePercentage.toFixed(1)}%</p>
              {summary.trend === "up" && <TrendingUp className="h-4 w-4 text-red-600" />}
              {summary.trend === "down" && <TrendingDown className="h-4 w-4 text-green-600" />}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <p className="text-xs text-muted-foreground mb-1">High Waste</p>
            <p className="text-2xl font-bold text-red-600">
              {summary.highWasteTransformations}
              <span className="text-sm font-normal text-muted-foreground ml-1">events</span>
            </p>
          </div>
        </div>

        {/* Waste Percentage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Industry Standard: 5-7%</span>
            <span
              className={`font-medium ${
                summary.averageWastePercentage > 10
                  ? "text-red-600"
                  : summary.averageWastePercentage > 7
                    ? "text-orange-600"
                    : "text-green-600"
              }`}
            >
              Your Average: {summary.averageWastePercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={(Math.min(summary.averageWastePercentage, 15) / 15) * 100} className="h-2" />
          {summary.averageWastePercentage > 10 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-800">
                <span className="font-semibold">Waste quá cao!</span> FDA khuyến nghị waste dưới 10% để đảm bảo food
                safety. Cần review transformation processes.
              </p>
            </div>
          )}
        </div>

        {/* Recent High Waste Events */}
        {wasteData.filter((w) => (w.weighted_waste_percentage || 0) > 10).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">Recent High Waste Events:</p>
            {wasteData
              .filter((w) => (w.weighted_waste_percentage || 0) > 10)
              .slice(0, 3)
              .map((waste, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-red-50 rounded p-2 border border-red-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{waste.product_name}</p>
                    <p className="text-muted-foreground">{new Date(waste.transformation_date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="destructive" className="ml-2">
                    {waste.weighted_waste_percentage?.toFixed(1)}%
                  </Badge>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
