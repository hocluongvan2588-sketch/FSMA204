"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle, Shield } from "lucide-react"
import { useEffect, useState } from "react"

interface FDARegistration {
  id: string
  facility_name: string
  registration_date: string
  expiry_date: string
  fda_registration_number: string
  agent_registration_date?: string
  agent_expiry_date?: string
  agent_registration_years?: number
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

  const getFDACycleRange = () => {
    const currentYear = currentDate.getFullYear()

    // FDA cycles end on December 31 of even years
    let cycleEndYear = currentYear
    if (currentYear % 2 !== 0) {
      // If odd year, next even year
      cycleEndYear = currentYear + 1
    }

    const cycleStartYear = cycleEndYear - 2

    // Cycles are from Jan 1 of start year to Dec 31 of end year
    const cycleStart = new Date(cycleStartYear, 0, 1) // Jan 1
    const cycleEnd = new Date(cycleEndYear, 11, 31, 23, 59, 59) // Dec 31

    return { cycleStart, cycleEnd, cycleStartYear, cycleEndYear }
  }

  const getFDATimelineData = (reg: FDARegistration) => {
    const { cycleStart, cycleEnd, cycleStartYear, cycleEndYear } = getFDACycleRange()

    // Calculate total days in this 2-year cycle
    const totalDays = Math.floor((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate days elapsed from cycle start to today
    const daysFromStart = Math.floor((currentDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate days remaining to cycle end
    const daysToExpiry = Math.floor((cycleEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    // Progress percentage within the 2-year cycle
    const progressPercent = Math.min(Math.max((daysFromStart / totalDays) * 100, 0), 100)

    // Warning logic: Green > 90 days, Yellow 30-90 days, Red < 30 days or expired
    let status: "safe" | "warning" | "urgent" | "expired"
    if (daysToExpiry < 0) {
      status = "expired"
    } else if (daysToExpiry < 30) {
      status = "urgent"
    } else if (daysToExpiry < 90) {
      status = "warning"
    } else {
      status = "safe"
    }

    return {
      progressPercent,
      daysToExpiry,
      status,
      cycleStart,
      cycleEnd,
      cycleLabel: `${cycleStartYear}-${cycleEndYear}`,
    }
  }

  const getAgentTimelineData = (reg: FDARegistration) => {
    if (!reg.agent_registration_date || !reg.agent_expiry_date || !reg.agent_registration_years) {
      return null
    }

    const agentStartDate = new Date(reg.agent_registration_date)
    const agentExpiryDate = new Date(reg.agent_expiry_date)

    // Agent cycle is dynamic (1-3 years typically)
    const totalDays = reg.agent_registration_years * 365

    const daysFromStart = Math.floor((currentDate.getTime() - agentStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysToExpiry = Math.floor((agentExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    const progressPercent = Math.min(Math.max((daysFromStart / totalDays) * 100, 0), 100)

    // Warning logic for Agent
    let status: "safe" | "warning" | "urgent" | "expired"
    if (daysToExpiry < 0) {
      status = "expired"
    } else if (daysToExpiry < 30) {
      status = "urgent"
    } else if (daysToExpiry < 90) {
      status = "warning"
    } else {
      status = "safe"
    }

    return {
      progressPercent,
      daysToExpiry,
      status,
      agentStartDate,
      agentExpiryDate,
      years: reg.agent_registration_years,
    }
  }

  const getStatusBadge = (status: "safe" | "warning" | "urgent" | "expired", daysToExpiry: number) => {
    if (status === "expired") {
      return (
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          Quá hạn
        </Badge>
      )
    }

    if (status === "urgent") {
      return (
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          {daysToExpiry} ngày
        </Badge>
      )
    }

    if (status === "warning") {
      return (
        <Badge className="gap-1 bg-amber-500 text-white border-amber-600">
          <Clock className="h-3 w-3" />
          {daysToExpiry} ngày
        </Badge>
      )
    }

    return (
      <Badge className="gap-1 bg-emerald-500 text-white border-emerald-600">
        <Clock className="h-3 w-3" />
        {daysToExpiry} ngày
      </Badge>
    )
  }

  const getProgressBarColor = (status: "safe" | "warning" | "urgent" | "expired") => {
    switch (status) {
      case "expired":
        return "bg-gradient-to-r from-red-500 to-red-600"
      case "urgent":
        return "bg-gradient-to-r from-red-400 to-red-500"
      case "warning":
        return "bg-gradient-to-r from-amber-400 to-amber-500"
      default:
        return "bg-gradient-to-r from-emerald-400 to-emerald-500"
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
            const fdaTimeline = getFDATimelineData(reg)
            const agentTimeline = getAgentTimelineData(reg)

            return (
              <div key={reg.id} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{reg.facility_name}</p>
                    <p className="text-sm text-muted-foreground">#{reg.fda_registration_number}</p>
                  </div>
                </div>

                {/* FDA Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">📋 Đăng ký FDA</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Theo 21 CFR Part 1, Subpart H - Gia hạn mỗi 2 năm
                      </p>
                    </div>
                    {getStatusBadge(fdaTimeline.status, fdaTimeline.daysToExpiry)}
                  </div>

                  <div className="relative">
                    {/* Background bar */}
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      {/* Progress bar */}
                      <div
                        className={`h-full transition-all duration-500 ${getProgressBarColor(fdaTimeline.status)}`}
                        style={{ width: `${fdaTimeline.progressPercent}%` }}
                      />

                      {/* Today marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                        style={{ left: `${fdaTimeline.progressPercent}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="text-xs h-5 px-2 bg-white dark:bg-slate-900 border-blue-600"
                          >
                            Hôm nay
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Timeline labels */}
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{fdaTimeline.cycleStart.toLocaleDateString("vi-VN")}</span>
                      <span className="font-medium text-blue-600">{fdaTimeline.cycleLabel}</span>
                      <span>{fdaTimeline.cycleEnd.toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                {/* Agent Timeline */}
                {agentTimeline && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          <Shield className="inline h-4 w-4 mr-1" />
                          US Agent
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Theo 21 CFR 1.33(b) - Đại diện tại Hoa Kỳ bắt buộc
                        </p>
                      </div>
                      {getStatusBadge(agentTimeline.status, agentTimeline.daysToExpiry)}
                    </div>

                    <div className="relative">
                      {/* Background bar */}
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        {/* Progress bar */}
                        <div
                          className={`h-full transition-all duration-500 ${getProgressBarColor(agentTimeline.status)}`}
                          style={{ width: `${agentTimeline.progressPercent}%` }}
                        />

                        {/* Today marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                          style={{ left: `${agentTimeline.progressPercent}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="text-xs h-5 px-2 bg-white dark:bg-slate-900 border-blue-600"
                            >
                              Hôm nay
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Timeline labels */}
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{agentTimeline.agentStartDate.toLocaleDateString("vi-VN")}</span>
                        <span>{agentTimeline.agentExpiryDate.toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning if no Agent data */}
                {!agentTimeline && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Chưa có thông tin US Agent - FDA mất hiệu lực ngay!</span>
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
