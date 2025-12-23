import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface AnalyticsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function AnalyticsCard({ title, value, description, icon: Icon, trend, className }: AnalyticsCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <span
              className={cn(
                "font-medium",
                trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-slate-500",
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-slate-500 ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
