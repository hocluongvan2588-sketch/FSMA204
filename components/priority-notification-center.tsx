"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  description: string
  priority: "critical" | "high" | "medium" | "low"
  category: "compliance" | "expiry" | "quota" | "system"
  date: string
  actionUrl?: string
  dismissible: boolean
}

export function PriorityNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "critical" | "high">("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const supabase = createClient()
    const today = new Date()
    const thirtyDays = new Date(today)
    thirtyDays.setDate(today.getDate() + 30)

    const [lots, fda, quota] = await Promise.all([
      supabase
        .from("traceability_lots")
        .select("*, products(product_name)")
        .lte("expiry_date", thirtyDays.toISOString())
        .gte("expiry_date", today.toISOString())
        .eq("status", "active")
        .limit(5),
      supabase
        .from("fda_registrations")
        .select("*, facilities(name)")
        .lte("expiry_date", thirtyDays.toISOString())
        .gte("expiry_date", today.toISOString())
        .limit(3),
      // Quota check would go here
      Promise.resolve({ data: [] }),
    ])

    const allNotifications: Notification[] = [
      ...(lots.data?.map((lot) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(lot.expiry_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        )
        return {
          id: `lot-${lot.id}`,
          title: "Lô hàng sắp hết hạn",
          description: `${lot.products?.product_name} (${lot.tlc}) sẽ hết hạn trong ${daysUntilExpiry} ngày`,
          priority: (daysUntilExpiry <= 7 ? "critical" : daysUntilExpiry <= 14 ? "high" : "medium") as any,
          category: "expiry",
          date: lot.expiry_date!,
          actionUrl: `/dashboard/lots/${lot.id}`,
          dismissible: false,
        }
      }) || []),
      ...(fda.data?.map((reg) => ({
        id: `fda-${reg.id}`,
        title: "Đăng ký FDA sắp hết hạn",
        description: `${reg.facilities?.name} - ${reg.fda_registration_number}`,
        priority: "high" as any,
        category: "compliance" as any,
        date: reg.expiry_date!,
        actionUrl: "/dashboard/fda-registrations",
        dismissible: false,
      })) || []),
    ]

    setNotifications(allNotifications)
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true
    return n.priority === filter
  })

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500 bg-red-50"
      case "high":
        return "border-l-amber-500 bg-amber-50"
      default:
        return "border-l-blue-500 bg-blue-50"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trung tâm thông báo</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="h-7 text-xs"
            >
              Tất cả
            </Button>
            <Button
              size="sm"
              variant={filter === "critical" ? "destructive" : "outline"}
              onClick={() => setFilter("critical")}
              className="h-7 text-xs"
            >
              Khẩn cấp
            </Button>
            <Button
              size="sm"
              variant={filter === "high" ? "default" : "outline"}
              onClick={() => setFilter("high")}
              className="h-7 text-xs"
            >
              Quan trọng
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Không có thông báo</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 rounded-lg p-4 ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{getPriorityIcon(notification.priority)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      {notification.dismissible && (
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="shrink-0 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{notification.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {notification.category}
                      </Badge>
                      {notification.actionUrl && (
                        <Button asChild size="sm" variant="ghost" className="h-6 text-xs px-2">
                          <Link href={notification.actionUrl}>Xem chi tiết →</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
