import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
}

export function StatsCard({ title, value, change, changeLabel, icon, className, valueClassName }: StatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4" />
    return change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-slate-500"
    return change > 0 ? "text-green-600" : "text-red-600"
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs mt-2", getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">
              {change > 0 ? "+" : ""}
              {change}%
            </span>
            {changeLabel && <span className="text-slate-500 ml-1">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
