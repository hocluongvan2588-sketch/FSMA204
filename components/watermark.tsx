"use client"

import { useEffect, useState } from "react"

interface WatermarkProps {
  /**
   * Show watermark for free plan users
   */
  visible?: boolean
  /**
   * Position of watermark
   */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  /**
   * Opacity (0-1)
   */
  opacity?: number
}

export function Watermark({ visible = true, position = "bottom-right", opacity = 0.3 }: WatermarkProps) {
  if (!visible) return null

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 pointer-events-none select-none`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Powered by <span className="font-bold">Vexim</span>
      </div>
    </div>
  )
}

/**
 * PDF Watermark component for generating watermarked PDFs
 */
export function PDFWatermark() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        opacity: 0.4,
        fontSize: "10px",
        color: "#64748b",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      Powered by Vexim FSMA 204
    </div>
  )
}

/**
 * Hook to check if user is on free plan and should see watermark
 */
export function useWatermark(companyId: string | null) {
  const [showWatermark, setShowWatermark] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPlan() {
      if (!companyId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/subscription-status?companyId=${companyId}`)
        const data = await response.json()

        // Show watermark if no active subscription or if on free plan
        const onFreePlan =
          data.status === "none" || data.status === "expired" || data.packageName?.toLowerCase().includes("free")

        setShowWatermark(onFreePlan)
      } catch (error) {
        console.error("[v0] Failed to check watermark status:", error)
        setShowWatermark(false)
      } finally {
        setLoading(false)
      }
    }

    checkPlan()
  }, [companyId])

  return { showWatermark, loading }
}
