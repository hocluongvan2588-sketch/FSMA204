"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function RecalculateButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRecalculate() {
    try {
      setLoading(true)

      const response = await fetch("/api/subscription-recalculate", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to recalculate usage")
      }

      toast.success("Đã đồng bộ lại usage thành công")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Recalculate error:", error)
      toast.error(error.message || "Không thể đồng bộ usage")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRecalculate} disabled={loading} variant="outline" size="sm">
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      Đồng bộ usage
    </Button>
  )
}
