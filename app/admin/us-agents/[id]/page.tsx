"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText } from "lucide-react"
import Link from "next/link"
import { AgentAssignmentsTable } from "@/components/agent-assignments-table"
import { redirect } from "next/navigation"

interface USAgent {
  id: string
  agent_name: string
  agent_company_name: string | null
  agent_type: string
  email: string
  phone: string
  street_address: string
  city: string
  state: string
  zip_code: string
  country: string
  contract_status: string
  notes: string | null
  is_active: boolean
}

interface AgentAssignment {
  id: string
  assignment_date: string
  expiry_date: string
  status: string
  assignment_years: number
  companies: {
    name: string
  }
  fda_registrations: {
    fda_registration_number: string | null
  }
}

export default function USAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [agent, setAgent] = useState<USAgent | null>(null)
  const [assignments, setAssignments] = useState<AgentAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkUserRole()
    loadData()
  }, [resolvedParams.id])

  const checkUserRole = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      redirect("/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    setUserRole(profile?.role || null)
  }

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Fetch agent details
    const { data: agentData } = await supabase.from("us_agents").select("*").eq("id", resolvedParams.id).single()

    if (agentData) {
      setAgent(agentData)
    }

    // Fetch agent assignments
    const { data: assignmentsData } = await supabase
      .from("agent_assignments")
      .select(
        `
        *,
        companies (name),
        fda_registrations (fda_registration_number)
      `,
      )
      .eq("us_agent_id", resolvedParams.id)
      .order("assignment_date", { ascending: false })

    if (assignmentsData) {
      setAssignments(assignmentsData as any)
    }

    setIsLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Đang hoạt động", className: "bg-green-100 text-green-700" },
      expired: { label: "Hết hạn", className: "bg-red-100 text-red-700" },
      cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-700" },
    }
    return config[status] || config.active
  }

  const activeAssignments = assignments.filter((a) => a.status === "active")
  const inactiveAssignments = assignments.filter((a) => a.status !== "active")

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Không tìm thấy US Agent</p>
          <Button asChild className="mt-4">
            <Link href="/admin/us-agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isSystemAdmin = userRole === "system_admin"

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/us-agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.agent_name}</h1>
            <p className="text-muted-foreground">Chi tiết US Agent và assignments</p>
          </div>
        </div>
        <Badge className={getStatusBadge(agent.contract_status).className}>
          {getStatusBadge(agent.contract_status).label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Loại Agent</p>
                <p className="font-medium capitalize">{agent.agent_type}</p>
                {agent.agent_company_name && (
                  <p className="text-sm text-muted-foreground mt-1">{agent.agent_company_name}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{agent.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium">{agent.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Địa chỉ</p>
                <p className="font-medium">{agent.street_address}</p>
                <p className="text-sm text-muted-foreground">
                  {agent.city}, {agent.state} {agent.zip_code}
                </p>
                <p className="text-sm text-muted-foreground">{agent.country}</p>
              </div>
            </div>

            {agent.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú</p>
                  <p className="text-sm">{agent.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{assignments.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Tổng số</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{activeAssignments.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Đang hoạt động</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">{inactiveAssignments.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Đã kết thúc</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Trạng thái hợp đồng</p>
              <Badge className={getStatusBadge(agent.contract_status).className + " text-lg py-2 px-4"}>
                {getStatusBadge(agent.contract_status).label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      {activeAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignments đang hoạt động ({activeAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentAssignmentsTable
              assignments={activeAssignments.map((a) => ({
                id: a.id,
                company_name: a.companies.name,
                fda_registration_number: a.fda_registrations?.fda_registration_number || null,
                assignment_date: a.assignment_date,
                expiry_date: a.expiry_date,
                status: a.status,
                assignment_years: a.assignment_years,
              }))}
              isSystemAdmin={isSystemAdmin}
              onUpdate={loadData}
            />
          </CardContent>
        </Card>
      )}

      {/* Inactive Assignments */}
      {inactiveAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignments đã kết thúc ({inactiveAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentAssignmentsTable
              assignments={inactiveAssignments.map((a) => ({
                id: a.id,
                company_name: a.companies.name,
                fda_registration_number: a.fda_registrations?.fda_registration_number || null,
                assignment_date: a.assignment_date,
                expiry_date: a.expiry_date,
                status: a.status,
                assignment_years: a.assignment_years,
              }))}
              isSystemAdmin={isSystemAdmin}
              onUpdate={loadData}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
