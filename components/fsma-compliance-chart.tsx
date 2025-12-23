"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileCheck, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"

interface FSMAComplianceChartProps {
  totalLots: number
  lotsWithKDE: number
}

export function FSMAComplianceChart({ totalLots, lotsWithKDE }: FSMAComplianceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const compliancePercent = totalLots > 0 ? Math.round((lotsWithKDE / totalLots) * 100) : 0
  const missingKDELots = totalLots - lotsWithKDE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 200
    canvas.height = 200

    const centerX = 100
    const centerY = 100
    const radius = 80
    const lineWidth = 24

    // Background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = "#e5e7eb" // slate-200
    ctx.lineWidth = lineWidth
    ctx.stroke()

    // Progress arc
    const progressAngle = (compliancePercent / 100) * 2 * Math.PI
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, -0.5 * Math.PI + progressAngle)

    // Gradient for progress
    const gradient = ctx.createLinearGradient(0, 0, 200, 200)
    if (compliancePercent >= 80) {
      gradient.addColorStop(0, "#10b981") // emerald-500
      gradient.addColorStop(1, "#059669") // emerald-600
    } else if (compliancePercent >= 50) {
      gradient.addColorStop(0, "#f59e0b") // amber-500
      gradient.addColorStop(1, "#d97706") // amber-600
    } else {
      gradient.addColorStop(0, "#ef4444") // red-500
      gradient.addColorStop(1, "#dc2626") // red-600
    }

    ctx.strokeStyle = gradient
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.stroke()
  }, [compliancePercent])

  return (
    <Card className="rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileCheck className="h-5 w-5 text-emerald-600" />
          Tuân thủ FSMA 204
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Tỷ lệ lô hàng có đủ hồ sơ KDE (Key Data Elements)</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative">
            <canvas ref={canvasRef} className="mx-auto" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-foreground">{compliancePercent}%</p>
              <p className="text-sm text-muted-foreground">Đạt chuẩn</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950">
              <p className="text-2xl font-bold text-emerald-600">{lotsWithKDE}</p>
              <p className="text-xs text-muted-foreground mt-1">Lô đủ KDE</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-red-50 dark:bg-red-950">
              <p className="text-2xl font-bold text-red-600">{missingKDELots}</p>
              <p className="text-xs text-muted-foreground mt-1">Lô thiếu hồ sơ</p>
            </div>
          </div>

          {missingKDELots > 0 && (
            <Button asChild className="w-full mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700" size="lg">
              <Link href="/dashboard/lots?filter=missing_kde">
                <AlertCircle className="h-4 w-4 mr-2" />
                Xem lô thiếu hồ sơ ({missingKDELots})
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
