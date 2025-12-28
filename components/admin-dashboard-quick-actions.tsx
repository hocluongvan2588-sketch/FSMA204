"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, FileText, Download } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  isSystemAdmin: boolean
}

export function AdminDashboardQuickActions({ isSystemAdmin }: QuickActionsProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {isSystemAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="justify-start bg-transparent"
            onClick={() => router.push("/dashboard/company/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo công ty
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent"
          onClick={() => router.push("/admin/users?action=create")}
        >
          <Users className="h-4 w-4 mr-2" />
          Tạo user
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent"
          onClick={() => router.push("/admin/facility-requests")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Yêu cầu chờ
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent"
          onClick={() => router.push("/admin/system-logs")}
        >
          <Download className="h-4 w-4 mr-2" />
          Export logs
        </Button>
      </CardContent>
    </Card>
  )
}
