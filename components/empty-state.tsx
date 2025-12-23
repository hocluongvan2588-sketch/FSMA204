"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {Icon && <Icon className="h-16 w-16 text-slate-300 mb-4" />}
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        {description && <p className="text-slate-500 mb-6 text-center max-w-md">{description}</p>}
        {action && (
          <Button onClick={action.onClick} asChild={!!action.href}>
            {action.href ? <a href={action.href}>{action.label}</a> : action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
