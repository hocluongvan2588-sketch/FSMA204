"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Zap, Rocket, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import type { JSX } from "react"

interface PlanBadgeProps {
  companyId: string
  variant?: "default" | "compact"
}

export function PlanBadge({ companyId, variant = "default" }: PlanBadgeProps) {
  const [plan, setPlan] = useState<{
    name: string
    code: string
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      try {
        const response = await fetch(`/api/company-plan?companyId=${companyId}`)
        const data = await response.json()

        if (data.plan) {
          setPlan(data.plan)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch plan:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [companyId])

  if (loading || !plan) {
    return null
  }

  const getIcon = (code: string) => {
    const icons: Record<string, JSX.Element> = {
      FREE: <Sparkles className="h-3 w-3" />,
      STARTER: <Zap className="h-3 w-3" />,
      PROFESSIONAL: <Rocket className="h-3 w-3" />,
      BUSINESS: <Crown className="h-3 w-3" />,
      ENTERPRISE: <Crown className="h-3 w-3" />,
    }
    return icons[code] || null
  }

  const getColor = (code: string) => {
    const colors: Record<string, string> = {
      FREE: "bg-slate-100 text-slate-700 border-slate-300",
      STARTER: "bg-emerald-100 text-emerald-700 border-emerald-300",
      PROFESSIONAL: "bg-blue-100 text-blue-700 border-blue-300",
      BUSINESS: "bg-purple-100 text-purple-700 border-purple-300",
      ENTERPRISE: "bg-amber-100 text-amber-700 border-amber-300",
    }
    return colors[code] || "bg-slate-100 text-slate-700"
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      trial: "bg-blue-100 text-blue-700",
      expired: "bg-red-100 text-red-700",
    }
    return colors[status] || "bg-slate-100 text-slate-700"
  }

  if (variant === "compact") {
    return (
      <Badge className={`${getColor(plan.code)} border font-medium`}>
        {getIcon(plan.code)}
        <span className="ml-1">{plan.name}</span>
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getColor(plan.code)} border font-medium`}>
        {getIcon(plan.code)}
        <span className="ml-1">{plan.name}</span>
      </Badge>
      <Badge className={getStatusColor(plan.status)} variant="secondary">
        {plan.status === "active" ? "Đang hoạt động" : plan.status === "trial" ? "Dùng thử" : "Hết hạn"}
      </Badge>
    </div>
  )
}
