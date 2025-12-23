"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSmartMenu } from "@/lib/utils/smart-menu"

interface SmartNavigationProps {
  items: Array<{
    id: string
    label: string
    href: string
    icon?: React.ReactNode
  }>
}

export function SmartNavigation({ items }: SmartNavigationProps) {
  const pathname = usePathname()
  const { highlightedItems } = useSmartMenu()

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const isHighlighted = highlightedItems.includes(item.id)

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              isHighlighted && "ring-2 ring-blue-400 ring-offset-2 animate-pulse",
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {isHighlighted && (
              <span className="ml-auto">
                <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
