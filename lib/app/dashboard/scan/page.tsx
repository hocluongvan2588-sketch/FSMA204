"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Camera, ScanLine, History, AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { BrowserQRCodeReader } from "@zxing/browser"

interface ScanResult {
  tlc: string
  timestamp: Date
  lot?: {
    id: string
    tlc: string
    batch_number: string
    production_date: string
    expiry_date: string
    quantity: number
    unit: string
    status: string
    products: { product_name: string; product_code: string } | null
    facilities: { name: string } | null
  }
}

export default function ScanPage() {
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual")
  const [manualInput, setManualInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ScanResult[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)

  useEffect(() => {
    // Load scan history from localStorage
    const savedHistory = localStorage.getItem("scan_history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      console.log("[v0] Starting camera...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        streamRef.current = stream
        console.log("[v0] Camera started successfully")
      }

      setScanning(true)
      setError(null)

      codeReaderRef.current = new BrowserQRCodeReader()
      startScanning()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Không thể truy cập camera: ${errorMessage}. Vui lòng cho phép quyền camera.`)
      console.error("[v0] Camera error:", err)
    }
  }

  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current) return

    try {
      const controls = await codeReaderRef.current.decodeFromVideoElement(videoRef.current, (result, error) => {
        if (result) {
          console.log("[v0] QR Code detected:", result.getText())
          handleScan(result.getText())
          // Stop scanning after successful scan
          controls.stop()
          stopCamera()
          setScanMode("manual")
        }
      })
    } catch (err) {
      console.error("[v0] Scanning error:", err)
    }
  }

  const stopCamera = () => {
    console.log("[v0] Stopping camera...")

    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const handleScan = async (tlcCode: string) => {
    if (!tlcCode.trim()) {
      setError("Vui lòng nhập mã TLC")
      return
    }

    setError(null)
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from("traceability_lots")
      .select("*, products(product_name, product_code), facilities(name)")
      .eq("tlc", tlcCode.trim())
      .single()

    if (fetchError || !data) {
      setError(`Không tìm thấy mã TLC: ${tlcCode}`)
      setResult(null)
      return
    }

    if (data.status === "quarantined") {
      setError(`⛔ Lô hàng ${tlcCode} đang bị CÁCH LY. Không được phép quét để xử lý tiếp.`)
      setResult(null)
      return
    }

    if (data.status === "recalled") {
      setError(`🚫 Lô hàng ${tlcCode} đã bị THU HỒI. Không được phép quét để xử lý tiếp.`)
      setResult(null)
      return
    }

    const { data: lastCTE } = await supabase
      .from("critical_tracking_events")
      .select("event_type, event_date, facilities(name)")
      .eq("tlc_id", data.id)
      .order("event_date", { ascending: false })
      .limit(1)
      .single()

    const scanResult: ScanResult = {
      tlc: tlcCode,
      timestamp: new Date(),
      lot: data as any,
    }

    setResult(scanResult)
    setManualInput("")

    if (lastCTE) {
      console.log("[v0] Last CTE:", lastCTE)
    }
  }

  const handleManualScan = () => {
    handleScan(manualInput)
  }

  const toggleScanMode = () => {
    if (scanMode === "manual") {
      setScanMode("camera")
      startCamera()
    } else {
      setScanMode("manual")
      stopCamera()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quét mã TLC</h1>
          <p className="text-muted-foreground mt-1">Quét QR code hoặc nhập mã thủ công</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quét mã</span>
              <Button variant="outline" size="sm" onClick={toggleScanMode}>
                {scanMode === "camera" ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Đóng Camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Mở Camera
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanMode === "camera" ? (
              <div className="space-y-4">
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-4 border-green-500 rounded-lg">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ScanLine className="w-full h-1 text-green-500 animate-scan" />
                        </div>
                      </div>
                    </div>
                  )}
                  {!scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Đang khởi động camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Đưa mã QR vào khung hình xanh. Hệ thống sẽ tự động quét khi phát hiện mã.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nhập mã TLC</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ví dụ: TLC-2024-001"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
                      className="flex-1"
                    />
                    <Button onClick={handleManualScan}>Quét</Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <ScanLine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Nhập mã TLC và nhấn Enter hoặc nút Quét</p>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Result Panel */}
        <div className="space-y-6">
          {result && result.lot && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin lô hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mã TLC</span>
                    <span className="font-mono font-semibold">{result.lot.tlc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <Badge
                      variant={
                        result.lot.status === "active"
                          ? "default"
                          : result.lot.status === "recalled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.lot.status === "active"
                        ? "Hoạt động"
                        : result.lot.status === "recalled"
                          ? "Thu hồi"
                          : result.lot.status === "expired"
                            ? "Hết hạn"
                            : "Đã dùng"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sản phẩm</span>
                    <span className="font-medium">{result.lot.products?.product_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mã lô</span>
                    <span>{result.lot.batch_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cơ sở</span>
                    <span>{result.lot.facilities?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ngày SX</span>
                    <span>{new Date(result.lot.production_date).toLocaleDateString("vi-VN")}</span>
                  </div>
                  {result.lot.expiry_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ngày HSD</span>
                      <span>{new Date(result.lot.expiry_date).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Số lượng</span>
                    <span>
                      {result.lot.quantity} {result.lot.unit}
                    </span>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/dashboard/lots/${result.lot.id}`}>Xem chi tiết đầy đủ</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Lịch sử quét
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Chưa có lịch sử quét</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                      <div>
                        <p className="font-mono text-sm font-medium">{item.tlc}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleScan(item.tlc)}>
                        Quét lại
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
