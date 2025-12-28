"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, AlertCircle, Users, Clock, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface ActivityStats {
  criticalActionsLast24h: number
  pendingApprovals: number
  activeSessions: number
  lastAdminActions: Array<{
    id: string
    action: string
    description: string
    created_at: string
    profiles: { full_name: string; role: string }
  }>
}

export function AdminDashboardActivityCard({ stats }: { stats: ActivityStats }) {
  const router = useRouter()

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Hoạt động hệ thống</CardTitle>
          </div>
          {stats.criticalActionsLast24h > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {stats.criticalActionsLast24h}
            </Badge>
          )}
        </div>
        <CardDescription>Tổng quan 24h gần nhất</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <p className="text-lg font-bold">{stats.criticalActionsLast24h}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-xs text-muted-foreground">Chờ duyệt</p>
            </div>
            <p className="text-lg font-bold">{stats.pendingApprovals}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <p className="text-lg font-bold">{stats.activeSessions}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Hành động gần nhất</p>
          <div className="space-y-1.5">
            {stats.lastAdminActions.slice(0, 3).map((action) => (
              <div key={action.id} className="flex items-start gap-2 text-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{action.description}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {formatDistanceToNow(new Date(action.created_at), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => router.push("/admin/activity")}
        >
          Xem tất cả
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}
