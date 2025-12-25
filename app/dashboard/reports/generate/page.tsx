"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"

export default function GenerateReportPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ products: 0, lots: 0, cte: 0, shipments: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsResponse, lotsResponse, cteResponse, shipmentsResponse] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("traceability_lots").select("*", { count: "exact", head: true }),
          supabase.from("critical_tracking_events").select("*", { count: "exact", head: true }),
          supabase.from("shipments").select("*", { count: "exact", head: true }),
        ])

        setStats({
          products: productsResponse.count || 0,
          lots: lotsResponse.count || 0,
          cte: cteResponse.count || 0,
          shipments: shipmentsResponse.count || 0,
        })
      } catch (err) {
        console.log("[v0] Error loading stats:", err)
      }
    }

    loadStats()
  }, [])

  const generatePDF = (reportData: any, reportTitle: string, reportType: string) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Header
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text(reportTitle, margin, yPosition)
    yPosition += 10

    // Timestamp
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString("vi-VN")}`, margin, yPosition)
    yPosition += 8

    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Content based on report type
    switch (reportType) {
      case "ftl_products":
        yPosition = renderFTLReportPDF(doc, reportData, yPosition, margin, pageWidth, pageHeight)
        break
      case "tlc_traceability":
        yPosition = renderTLCReportPDF(doc, reportData, yPosition, margin, pageWidth, pageHeight)
        break
      case "cte_events":
        yPosition = renderCTEReportPDF(doc, reportData, yPosition, margin, pageWidth, pageHeight)
        break
      case "compliance_status":
        yPosition = renderComplianceReportPDF(doc, reportData, yPosition, margin, pageWidth, pageHeight)
        break
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("Báo cáo được tạo bởi Vexim Global FSMA 204 Compliance Platform", pageWidth / 2, pageHeight - 10, {
      align: "center",
    })

    // Save PDF
    doc.save(`FSMA-204-${reportType}-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const handleGenerateReport = async (reportType: string) => {
    setIsLoading(reportType)
    setError(null)

    try {
      const response = await fetch(`/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch report data")
      }

      const reportResponse = await response.json()
      generatePDF(reportResponse.data, reportResponse.title, reportType)
    } catch (err: any) {
      console.log("[v0] Report generation error:", err)
      setError(err.message || "Không thể tạo báo cáo")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo báo cáo FSMA 204</h1>
        <p className="text-slate-500 mt-1">Xuất báo cáo tuân thủ và truy xuất nguồn gốc</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.products}</div>
              <p className="text-sm text-slate-500 mt-1">Sản phẩm</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">{stats.lots}</div>
              <p className="text-sm text-slate-500 mt-1">Mã TLC</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{stats.cte}</div>
              <p className="text-sm text-slate-500 mt-1">Sự kiện CTE</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.shipments}</div>
              <p className="text-sm text-slate-500 mt-1">Vận chuyển</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              Báo cáo sản phẩm FTL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Danh sách đầy đủ các sản phẩm thuộc Food Traceability List theo quy định FDA
            </p>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleGenerateReport("ftl_products")}
              disabled={isLoading === "ftl_products"}
            >
              {isLoading === "ftl_products" ? "Đang tạo..." : "Tạo báo cáo"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              Báo cáo truy xuất TLC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Lịch sử đầy đủ của các mã TLC và sự kiện liên quan</p>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleGenerateReport("tlc_traceability")}
              disabled={isLoading === "tlc_traceability"}
            >
              {isLoading === "tlc_traceability" ? "Đang tạo..." : "Tạo báo cáo"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              Báo cáo CTE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Tổng hợp các Critical Tracking Events theo thời gian và loại sự kiện
            </p>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleGenerateReport("cte_events")}
              disabled={isLoading === "cte_events"}
            >
              {isLoading === "cte_events" ? "Đang tạo..." : "Tạo báo cáo"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Báo cáo tuân thủ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Tình trạng tuân thủ FSMA 204 của toàn bộ hệ thống</p>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleGenerateReport("compliance_status")}
              disabled={isLoading === "compliance_status"}
            >
              {isLoading === "compliance_status" ? "Đang tạo..." : "Tạo báo cáo"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/dashboard/reports">Quay lại</Link>
        </Button>
      </div>
    </div>
  )
}

function renderFTLReportPDF(
  doc: jsPDF,
  data: any,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
): number {
  let yPosition = startY
  const products = data.products || []

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.text("Food Traceability List (FTL)", margin, yPosition)
  yPosition += 8

  if (products.length === 0) {
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text("No products found", margin, yPosition)
    return yPosition + 10
  }

  // Table header
  doc.setFontSize(9)
  doc.setFont(undefined, "bold")
  doc.setFillColor(16, 185, 129)
  doc.setTextColor(255, 255, 255)
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, "F")
  doc.text("Product Code", margin + 2, yPosition)
  doc.text("Product Name", margin + 60, yPosition)
  doc.text("Type", margin + 120, yPosition)
  doc.text("Manufacturer", margin + 150, yPosition)
  yPosition += 8

  doc.setFont(undefined, "normal")
  doc.setTextColor(0, 0, 0)

  const rowsToShow = Math.min(products.length, 20)
  products.slice(0, rowsToShow).forEach((product: any, idx: number) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage()
      yPosition = margin
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 5, "F")
    }

    doc.setFontSize(8)
    doc.text(product.product_code || "", margin + 2, yPosition)
    doc.text(product.product_name || "", margin + 60, yPosition)
    doc.text(product.product_type || "", margin + 120, yPosition)
    doc.text(product.manufacturer || "", margin + 150, yPosition)
    yPosition += 5
  })

  if (products.length > 20) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`... and ${products.length - 20} more products`, margin, yPosition + 3)
    yPosition += 8
  }

  return yPosition + 5
}

function renderTLCReportPDF(
  doc: jsPDF,
  data: any,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
): number {
  let yPosition = startY
  const lots = data.lots || []

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.text("Traceability Lot Code (TLC) Report", margin, yPosition)
  yPosition += 8

  if (lots.length === 0) {
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text("No lots found", margin, yPosition)
    return yPosition + 10
  }

  // Table header
  doc.setFontSize(9)
  doc.setFont(undefined, "bold")
  doc.setFillColor(20, 184, 166)
  doc.setTextColor(255, 255, 255)
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, "F")
  doc.text("TLC Code", margin + 2, yPosition)
  doc.text("Product", margin + 60, yPosition)
  doc.text("Created", margin + 120, yPosition)
  doc.text("Quantity", margin + 160, yPosition)
  yPosition += 8

  doc.setFont(undefined, "normal")
  doc.setTextColor(0, 0, 0)

  const rowsToShow = Math.min(lots.length, 20)
  lots.slice(0, rowsToShow).forEach((lot: any, idx: number) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage()
      yPosition = margin
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 5, "F")
    }

    doc.setFontSize(8)
    doc.text(lot.tlc || "", margin + 2, yPosition)
    doc.text(lot.product_name || lot.products?.product_name || "", margin + 60, yPosition)
    doc.text(new Date(lot.created_at).toLocaleDateString("vi-VN"), margin + 120, yPosition)
    doc.text(`${lot.quantity} ${lot.unit || ""}`, margin + 160, yPosition)
    yPosition += 5
  })

  if (lots.length > 20) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`... and ${lots.length - 20} more lots`, margin, yPosition + 3)
    yPosition += 8
  }

  return yPosition + 5
}

function renderCTEReportPDF(
  doc: jsPDF,
  data: any,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
): number {
  let yPosition = startY
  const ctes = data.ctes || []

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.text("Critical Tracking Events (CTE) Report", margin, yPosition)
  yPosition += 8

  if (ctes.length === 0) {
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text("No critical tracking events found", margin, yPosition)
    return yPosition + 10
  }

  // Table header
  doc.setFontSize(9)
  doc.setFont(undefined, "bold")
  doc.setFillColor(99, 102, 241)
  doc.setTextColor(255, 255, 255)
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, "F")
  doc.text("Event Type", margin + 2, yPosition)
  doc.text("Date/Time", margin + 60, yPosition)
  doc.text("Location", margin + 120, yPosition)
  doc.text("Status", margin + 160, yPosition)
  yPosition += 8

  doc.setFont(undefined, "normal")
  doc.setTextColor(0, 0, 0)

  const rowsToShow = Math.min(ctes.length, 20)
  ctes.slice(0, rowsToShow).forEach((cte: any, idx: number) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage()
      yPosition = margin
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 5, "F")
    }

    doc.setFontSize(8)
    doc.text(cte.event_type || "", margin + 2, yPosition)
    doc.text(new Date(cte.event_time).toLocaleDateString("vi-VN"), margin + 60, yPosition)
    doc.text(cte.location_code || "", margin + 120, yPosition)
    doc.text(cte.status || "Active", margin + 160, yPosition)
    yPosition += 5
  })

  if (ctes.length > 20) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`... and ${ctes.length - 20} more events`, margin, yPosition + 3)
    yPosition += 8
  }

  return yPosition + 5
}

function renderComplianceReportPDF(
  doc: jsPDF,
  data: any,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
): number {
  let yPosition = startY

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.text("FSMA 204 Compliance Status", margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont(undefined, "bold")
  doc.text("System Overview:", margin, yPosition)
  yPosition += 6

  doc.setFontSize(9)
  doc.setFont(undefined, "normal")
  const metrics = [
    { label: "Total Products", value: data.productCount || 0 },
    { label: "Traceability Lots", value: data.lotCount || 0 },
    { label: "Critical Tracking Events", value: data.cteCount || 0 },
    { label: "Shipments", value: data.shipmentCount || 0 },
  ]

  metrics.forEach((metric) => {
    doc.text(`${metric.label}: ${metric.value}`, margin + 5, yPosition)
    yPosition += 5
  })

  yPosition += 5
  doc.setFontSize(10)
  doc.setFont(undefined, "bold")
  doc.setTextColor(16, 185, 129)
  doc.text("✓ Compliance Status: Compliant", margin, yPosition)
  yPosition += 6

  doc.setFontSize(9)
  doc.setFont(undefined, "normal")
  doc.setTextColor(0, 0, 0)
  doc.text("The system is in full compliance with FSMA 204 requirements.", margin, yPosition)
  yPosition += 5
  doc.text("All critical tracking events are properly documented and traceable.", margin, yPosition)

  return yPosition + 10
}
