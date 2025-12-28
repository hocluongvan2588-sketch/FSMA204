"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, CheckCircle2, Lock, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface SecurityStats {
  systemAdminsWithMFA: number
  systemAdminsWithoutMFA: number
  totalSystemAdmins: number
  failedLoginsLast24h: number
  mfaComplianceRate: number
}

export function AdminDashboardSecurityCard({ stats }: { stats: SecurityStats }) {
  const router = useRouter()

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (rate: number) => {
    if (rate >= 90)
      return { variant: "default" as const, label: "Tốt", icon: CheckCircle2, color: "bg-green-100 text-green-700" }
    if (rate >= 70)
      return {
        variant: "secondary" as const,
        label: "Cảnh báo",
        icon: AlertTriangle,
        color: "bg-yellow-100 text-yellow-700",
      }
    return {
      variant: "destructive" as const,
      label: "Nguy hiểm",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700",
    }
  }

  const status = getStatusBadge(stats.mfaComplianceRate)
  const StatusIcon = status.icon

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Bảo mật hệ thống</CardTitle>
          </div>
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <CardDescription>Trạng thái xác thực và bảo mật</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tuân thủ 2FA</span>
            <span className={`font-semibold ${getStatusColor(stats.mfaComplianceRate)}`}>
              {stats.mfaComplianceRate}%
            </span>
          </div>
          <Progress value={stats.mfaComplianceRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-green-600" />
              <p className="text-xs text-muted-foreground">Đã bật 2FA</p>
            </div>
            <p className="text-lg font-bold">{stats.systemAdminsWithMFA}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <p className="text-xs text-muted-foreground">Chưa có 2FA</p>
            </div>
            <p className="text-lg font-bold text-red-600">{stats.systemAdminsWithoutMFA}</p>
          </div>
        </div>

        {stats.failedLoginsLast24h > 0 && (
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-md">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Đăng nhập thất bại (24h)</span>
            </div>
            <Badge variant="destructive">{stats.failedLoginsLast24h}</Badge>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 bg-transparent"
          onClick={() => router.push("/admin/security")}
        >
          Quản lý bảo mật
        </Button>
      </CardContent>
    </Card>
  )
}
