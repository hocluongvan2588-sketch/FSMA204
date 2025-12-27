"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Zap, Rocket, Sparkles, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

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

  const handleClick = () => {
    if (plan.code === "FREE") {
      router.push("/admin/my-subscription")
    } else {
      router.push("/admin/my-subscription")
    }
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${getColor(plan.code)} ${
          isHovered ? "shadow-md hover:scale-105 ring-2 ring-offset-2" : ""
        } ${isHovered && plan.code === "FREE" ? "ring-emerald-300" : "ring-slate-300"}`}
      >
        {getIcon(plan.code)}
        <span className="text-sm font-semibold">
          {isHovered && plan.code === "FREE" ? (
            <span className="flex items-center gap-1">
              Plan: Free
              <span className="text-xs font-bold text-emerald-600">(Upgrade)</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          ) : (
            plan.name
          )}
        </span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${getColor(plan.code)} ${
          isHovered ? "shadow-md hover:scale-105 ring-2 ring-offset-2" : ""
        } ${isHovered && plan.code === "FREE" ? "ring-emerald-300" : "ring-slate-300"}`}
      >
        {getIcon(plan.code)}
        <span>
          {isHovered && plan.code === "FREE" ? (
            <span className="flex items-center gap-1">
              Plan: Free
              <span className="text-xs font-bold text-emerald-600">(Upgrade)</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          ) : (
            plan.name
          )}
        </span>
      </button>
      <Badge className={getStatusColor(plan.status)} variant="secondary">
        {plan.status === "active" ? "Đang hoạt động" : plan.status === "trial" ? "Dùng thử" : "Hết hạn"}
      </Badge>
    </div>
  )
}
