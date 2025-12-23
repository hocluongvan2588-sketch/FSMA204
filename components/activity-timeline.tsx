import { getActivityLogs, getActionLabel } from "@/lib/utils/activity-logger"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface ActivityTimelineProps {
  entityType?: string
  entityId?: string
  limit?: number
}

export async function ActivityTimeline({ entityType, entityId, limit = 10 }: ActivityTimelineProps) {
  const logs = await getActivityLogs({
    entityType: entityType as any,
    entityId,
    limit,
  })

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Chưa có hoạt động nào</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lịch sử hoạt động</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                {log !== logs[logs.length - 1] && <div className="w-px h-full bg-slate-200 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{getActionLabel(log.action)}</Badge>
                  <span className="text-xs text-slate-500">{log.profiles?.full_name || "Unknown User"}</span>
                </div>
                <p className="text-sm text-slate-700 mb-1">{log.description}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.created_at).toLocaleString("vi-VN")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
