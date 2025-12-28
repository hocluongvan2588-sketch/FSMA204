"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle2, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface ComplianceStats {
  fdaRegistered: number
  totalFacilities: number
  complianceRate: number
  expiringRegistrations: number
  activeUSAgents: number
  expiringUSAgents: number
}

export function AdminDashboardComplianceCard({ stats }: { stats: ComplianceStats }) {
  const router = useRouter()

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">FDA Compliance</CardTitle>
          </div>
          <div className={`text-2xl font-bold ${getComplianceColor(stats.complianceRate)}`}>
            {stats.complianceRate}%
          </div>
        </div>
        <CardDescription>Trạng thái tuân thủ FDA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cơ sở đã đăng ký</span>
            <span className="font-semibold">
              {stats.fdaRegistered}/{stats.totalFacilities}
            </span>
          </div>
          <Progress value={stats.complianceRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <p className="text-xs text-muted-foreground">FDA Active</p>
            </div>
            <p className="text-lg font-bold">{stats.fdaRegistered}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-orange-600" />
              <p className="text-xs text-muted-foreground">Sắp hết hạn</p>
            </div>
            <p className="text-lg font-bold text-orange-600">{stats.expiringRegistrations}</p>
          </div>
        </div>

        {(stats.expiringRegistrations > 0 || stats.expiringUSAgents > 0) && (
          <div className="space-y-1.5 pt-2 border-t">
            {stats.expiringRegistrations > 0 && (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
                <span className="text-xs font-medium text-orange-700">FDA sắp hết hạn</span>
                <Badge className="bg-orange-100 text-orange-700">{stats.expiringRegistrations}</Badge>
              </div>
            )}
            {stats.expiringUSAgents > 0 && (
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                <span className="text-xs font-medium text-yellow-700">US Agent hết hạn</span>
                <Badge className="bg-yellow-100 text-yellow-700">{stats.expiringUSAgents}</Badge>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/fda-registrations")}>
            Quản lý FDA
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/us-agents")}>
            US Agents
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
