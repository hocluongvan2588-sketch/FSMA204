"use client"

interface TimelineEvent {
  type: "cte" | "shipment"
  id: string
  date: Date
  title: string
  description?: string | null
  facility?: string
  location?: string
  data: any
}

interface TraceabilityTimelineProps {
  events: TimelineEvent[]
}

export function TraceabilityTimeline({ events }: TraceabilityTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-teal-200 to-blue-200"></div>

      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-6">
            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg">
              {event.type === "cte" ? (
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 pb-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 capitalize">
                      {event.type === "cte"
                        ? event.data.event_type === "harvest"
                          ? "Thu hoạch"
                          : event.data.event_type === "cooling"
                            ? "Làm lạnh"
                            : event.data.event_type === "packing"
                              ? "Đóng gói"
                              : event.data.event_type === "receiving"
                                ? "Tiếp nhận"
                                : event.data.event_type === "transformation"
                                  ? "Chế biến"
                                  : "Vận chuyển"
                        : "Vận chuyển"}
                    </p>
                    <p className="text-sm text-slate-600">{event.facility}</p>
                    {event.location && <p className="text-xs text-slate-400">{event.location}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {event.date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.date.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {event.description && <p className="text-sm text-slate-700 mt-2">{event.description}</p>}

                {event.type === "cte" && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    {event.data.responsible_person && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>{event.data.responsible_person}</span>
                      </div>
                    )}
                    {event.data.quantity_processed && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        <span>
                          {event.data.quantity_processed} {event.data.unit}
                        </span>
                      </div>
                    )}
                    {event.data.temperature && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <span>{event.data.temperature}°C</span>
                      </div>
                    )}
                  </div>
                )}

                {event.type === "shipment" && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span>{event.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex gap-6 pt-4">
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-700">Đã cập nhật đầy đủ</p>
          <p className="text-sm text-slate-500">Hệ thống đã ghi nhận toàn bộ hành trình</p>
        </div>
      </div>
    </div>
  )
}
