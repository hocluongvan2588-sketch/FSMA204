"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface AgentAssignment {
  id: string
  company_name: string
  fda_registration_number: string | null
  assignment_date: string
  expiry_date: string
  status: string
  assignment_years: number
}

interface AgentAssignmentsTableProps {
  assignments: AgentAssignment[]
  isSystemAdmin: boolean
  onUpdate: () => void
}

export function AgentAssignmentsTable({ assignments, isSystemAdmin, onUpdate }: AgentAssignmentsTableProps) {
  const { toast } = useToast()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancelAssignment = async (assignmentId: string, companyName: string) => {
    if (!confirm(`Xác nhận hủy assignment cho ${companyName}?`)) return

    setCancellingId(assignmentId)
    const supabase = createClient()

    const { error } = await supabase
      .from("agent_assignments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", assignmentId)

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi hủy assignment",
        description: error.message,
      })
      setCancellingId(null)
      return
    }

    toast({
      title: "Hủy assignment thành công",
      description: `Đã hủy assignment cho ${companyName}`,
    })

    setCancellingId(null)
    onUpdate()
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Đang hoạt động", className: "bg-green-100 text-green-700" },
      expired: { label: "Hết hạn", className: "bg-red-100 text-red-700" },
      cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-700" },
    }
    return config[status] || config.active
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Agent này chưa được gán cho công ty nào</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Công ty</TableHead>
          <TableHead>Số FDA</TableHead>
          <TableHead>Ngày bắt đầu</TableHead>
          <TableHead>Thời hạn</TableHead>
          <TableHead>Ngày hết hạn</TableHead>
          <TableHead>Trạng thái</TableHead>
          {isSystemAdmin && <TableHead>Hành động</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => {
          const daysLeft = getDaysUntilExpiry(assignment.expiry_date)
          const isExpiringSoon = daysLeft > 0 && daysLeft <= 60

          return (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">{assignment.company_name}</TableCell>
              <TableCell>{assignment.fda_registration_number || "-"}</TableCell>
              <TableCell>{new Date(assignment.assignment_date).toLocaleDateString("vi-VN")}</TableCell>
              <TableCell>{assignment.assignment_years} năm</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{new Date(assignment.expiry_date).toLocaleDateString("vi-VN")}</span>
                  {isExpiringSoon && assignment.status === "active" && (
                    <Badge variant="outline" className="text-amber-600">
                      Còn {daysLeft} ngày
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadge(assignment.status).className}>
                  {getStatusBadge(assignment.status).label}
                </Badge>
              </TableCell>
              {isSystemAdmin && (
                <TableCell>
                  {assignment.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelAssignment(assignment.id, assignment.company_name)}
                      disabled={cancellingId === assignment.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Hủy
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
