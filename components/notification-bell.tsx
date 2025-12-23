"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const [expiringLots, expiringFda, pendingShipments] = await Promise.all([
      supabase
        .from("traceability_lots")
        .select("*, products(product_name)")
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .gte("expiry_date", today.toISOString())
        .eq("status", "active")
        .order("expiry_date", { ascending: true })
        .limit(3),
      supabase
        .from("fda_registrations")
        .select("*, facilities(name)")
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .gte("expiry_date", today.toISOString())
        .order("expiry_date", { ascending: true })
        .limit(2),
      supabase
        .from("shipments")
        .select("*, traceability_lots(tlc, products(product_name))")
        .eq("status", "pending")
        .order("shipment_date", { ascending: false })
        .limit(3),
    ])

    const allNotifications = [
      ...(expiringLots.data?.map((lot) => ({
        id: `lot-${lot.id}`,
        title: "Lô hàng sắp hết hạn",
        description: `${lot.products?.product_name} (${lot.tlc})`,
        date: lot.expiry_date,
        type: "warning" as const,
      })) || []),
      ...(expiringFda.data?.map((fda) => ({
        id: `fda-${fda.id}`,
        title: "Đăng ký FDA sắp hết hạn",
        description: fda.facilities?.name,
        date: fda.expiry_date,
        type: "warning" as const,
      })) || []),
      ...(pendingShipments.data?.map((shipment) => ({
        id: `shipment-${shipment.id}`,
        title: "Vận chuyển chờ xử lý",
        description: shipment.traceability_lots?.tlc,
        date: shipment.shipment_date,
        type: "info" as const,
      })) || []),
    ]

    setNotifications(allNotifications.slice(0, 5))
    setUnreadCount(allNotifications.length)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
      >
        <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-lg shadow-xl border border-slate-200">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} mới
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <svg
                    className="h-12 w-12 text-slate-300 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-slate-500">Không có thông báo mới</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        <div
                          className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            notification.type === "warning" ? "bg-amber-100" : "bg-blue-100"
                          }`}
                        >
                          <svg
                            className={`h-4 w-4 ${notification.type === "warning" ? "text-amber-600" : "text-blue-600"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 mb-1">{notification.title}</p>
                          <p className="text-xs text-slate-600 truncate">{notification.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.date).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t">
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                  Xem tất cả thông báo
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
