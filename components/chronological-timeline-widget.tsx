"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface TimelineEvent {
  id: string
  event_type: string
  event_date: string
  quantity_processed: number
  facility_name?: string
}

interface ChronologicalTimelineWidgetProps {
  tlcId: string
  className?: string
}

export function ChronologicalTimelineWidget({ tlcId, className }: ChronologicalTimelineWidgetProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const eventTypeMap: Record<string, { label: string; color: string; icon: string }> = {
    harvest: { label: "Thu hoạch", color: "bg-green-100 text-green-800", icon: "🌾" },
    cooling: { label: "Làm lạnh", color: "bg-blue-100 text-blue-800", icon: "❄️" },
    packing: { label: "Đóng gói", color: "bg-purple-100 text-purple-800", icon: "📦" },
    receiving: { label: "Tiếp nhận", color: "bg-yellow-100 text-yellow-800", icon: "📥" },
    transformation: { label: "Chế biến", color: "bg-orange-100 text-orange-800", icon: "🔄" },
    shipping: { label: "Vận chuyển", color: "bg-indigo-100 text-indigo-800", icon: "🚚" },
  }

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("critical_tracking_events")
        .select("id, event_type, event_date, quantity_processed, facilities(name)")
        .eq("tlc_id", tlcId)
        .order("event_date", { ascending: true })

      if (!error && data) {
        setEvents(
          data.map((e: any) => ({
            id: e.id,
            event_type: e.event_type,
            event_date: e.event_date,
            quantity_processed: e.quantity_processed,
            facility_name: e.facilities?.name,
          })),
        )
      }
      setLoading(false)
    }

    fetchEvents()
  }, [tlcId])

  const hasViolations = events.some((event, idx) => {
    if (idx === 0) return false
    const prevDate = new Date(events[idx - 1].event_date)
    const currDate = new Date(event.event_date)
    return currDate < prevDate
  })

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Đang tải timeline...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          Trình tự sự kiện FSMA 204
        </CardTitle>
        <CardDescription>
          {hasViolations ? (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Phát hiện vi phạm thứ tự thời gian
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Tuân thủ đúng trình tự chronological
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Chưa có sự kiện nào</p>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => {
              const eventInfo = eventTypeMap[event.event_type] || {
                label: event.event_type,
                color: "bg-slate-100 text-slate-800",
                icon: "📋",
              }

              let isViolation = false
              if (idx > 0) {
                const prevDate = new Date(events[idx - 1].event_date)
                const currDate = new Date(event.event_date)
                isViolation = currDate < prevDate
              }

              return (
                <div key={event.id}>
                  <div
                    className={`p-3 rounded-lg border ${
                      isViolation ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{eventInfo.icon}</span>
                        <Badge className={eventInfo.color}>{eventInfo.label}</Badge>
                        {isViolation && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Vi phạm thời gian
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {event.quantity_processed.toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      {new Date(event.event_date).toLocaleString("vi-VN")}
                    </div>
                    {event.facility_name && <p className="text-xs text-slate-500 mt-1">Cơ sở: {event.facility_name}</p>}
                  </div>
                  {idx < events.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
