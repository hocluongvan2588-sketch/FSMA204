"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface FDARegistration {
  id: string
  facility_name: string
  registration_date: string
  renewal_date: string
  expiry_date: string
  fda_registration_number: string
}

interface FDATimelineChartProps {
  registrations: FDARegistration[]
}

export function FDATimelineChart({ registrations }: FDATimelineChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Calculate timeline positions
  const getTimelineData = (reg: FDARegistration) => {
    const registrationDate = new Date(reg.registration_date)
    const renewalDate = new Date(reg.renewal_date)
    const expiryDate = new Date(reg.expiry_date)

    const totalDays = Math.floor((expiryDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromStart = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysToRenewal = Math.floor((renewalDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysToExpiry = Math.floor((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    const progressPercent = Math.min(Math.max((daysFromStart / totalDays) * 100, 0), 100)
    const renewalPercent = Math.min(
      Math.max(
        (Math.floor((renewalDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100,
        0,
      ),
      100,
    )

    return {
      progressPercent,
      renewalPercent,
      daysToRenewal,
      daysToExpiry,
      isUrgent: daysToRenewal < 30 && daysToRenewal >= 0,
      isPastDue: daysToRenewal < 0,
    }
  }

  return (
    <Card className="rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-5 w-5 text-blue-600" />
          Lộ trình quản lý thời hạn FDA
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi chu kỳ gia hạn 2 năm/lần - Deadline: 31/12 năm chẵn
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <p className="font-medium text-slate-900 mb-1">Chưa có đăng ký FDA</p>
            <p className="text-sm text-slate-500">Thêm đăng ký FDA để theo dõi thời hạn</p>
          </div>
        ) : (
          registrations.map((reg) => {
            const timeline = getTimelineData(reg)

            return (
              <div key={reg.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{reg.facility_name}</p>
                    <p className="text-sm text-muted-foreground">#{reg.fda_registration_number}</p>
                  </div>
                  {timeline.isUrgent && (
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      {timeline.daysToRenewal} ngày
                    </Badge>
                  )}
                  {timeline.isPastDue && (
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      Quá hạn
                    </Badge>
                  )}
                  {!timeline.isUrgent && !timeline.isPastDue && (
                    <Badge variant="secondary">{timeline.daysToRenewal} ngày</Badge>
                  )}
                </div>

                <div className="relative">
                  {/* Background bar */}
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    {/* Progress bar */}
                    <div
                      className={`h-full transition-all duration-500 ${
                        timeline.isPastDue
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : timeline.isUrgent
                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                            : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      }`}
                      style={{ width: `${timeline.progressPercent}%` }}
                    />

                    {/* Renewal marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-blue-600"
                      style={{ left: `${timeline.renewalPercent}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs font-medium text-blue-600">Gia hạn</span>
                      </div>
                    </div>

                    {/* Today marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-600"
                      style={{ left: `${timeline.progressPercent}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge variant="destructive" className="text-xs h-5 px-2">
                          Hôm nay
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Timeline labels */}
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{new Date(reg.registration_date).toLocaleDateString("vi-VN")}</span>
                    <span>{new Date(reg.expiry_date).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
