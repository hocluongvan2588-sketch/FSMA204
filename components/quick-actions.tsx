"use client"

import { Button } from "@/components/ui/button"
import { Plus, Printer, ScanLine, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: "Tạo lô hàng",
      href: "/dashboard/lots/create",
      gradient: "from-emerald-500 to-emerald-600",
      shadow: "shadow-emerald-500/20",
      dataTour: undefined,
    },
    {
      icon: Printer,
      label: "In mã TLC",
      href: "/dashboard/lots/print",
      gradient: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/20",
      dataTour: "print-labels", // Added data-tour for product tour
    },
    {
      icon: ScanLine,
      label: "Quét nhanh",
      href: "/dashboard/scan",
      gradient: "from-purple-500 to-purple-600",
      shadow: "shadow-purple-500/20",
      dataTour: "scan-qr", // Added data-tour for product tour
    },
    {
      icon: CheckCircle2,
      label: "Phê duyệt KDE",
      href: "/dashboard/cte/approve",
      gradient: "from-amber-500 to-amber-600",
      shadow: "shadow-amber-500/20",
      dataTour: "cte-approve", // Added data-tour for product tour
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.label}
            asChild
            variant="outline"
            data-tour={action.dataTour} // Applied data-tour attribute
            className={cn(
              "h-auto flex-col items-center gap-3 p-6 rounded-3xl border-2 hover:border-transparent transition-all duration-300",
              "bg-gradient-to-br",
              action.gradient,
              "text-white shadow-lg hover:shadow-xl",
              action.shadow,
              "hover:scale-105",
            )}
          >
            <Link href={action.href}>
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-center">{action.label}</span>
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
