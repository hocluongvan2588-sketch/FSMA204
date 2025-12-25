"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Edit, AlertCircle, Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface FDARegistration {
  id: string
  facility_id: string
  fda_registration_number: string | null
  registration_status: string
  registration_date: string | null
  expiry_date: string | null
  renewal_date: string | null
  fei_number: string | null
  duns_number: string | null
  facility_type_fda: string[] | null
  food_product_categories: string[] | null
  contact_name: string
  contact_email: string
  contact_phone: string
  notes: string | null
  last_inspection_date: string | null
  next_inspection_date: string | null
  notification_enabled: boolean
  notification_days_before: number
  agent_registration_date?: string | null
  agent_expiry_date?: string | null
  registration_years?: number | null
  created_at: string
  updated_at: string
  facility_name?: string
  facility_code?: string
  facility_type?: string
  facility_address?: string
  agent_name?: string
  agent_email?: string
}

interface Facility {
  id: string
  name: string
  facility_type: string
  location_code: string
  address: string
  company_id: string
}

interface USAgent {
  id: string
  agent_name: string
  email: string
  phone: string
  company_id: string
}

export default function FDARegistrationsPage() {
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<FDARegistration[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [usAgents, setUsAgents] = useState<USAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<FDARegistration>>({
    facility_id: "",
    fda_registration_number: "",
    registration_status: "pending",
    registration_date: "",
    expiry_date: "",
    renewal_date: "",
    fei_number: "",
    duns_number: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
    last_inspection_date: "",
    next_inspection_date: "",
    notification_enabled: true,
    notification_days_before: 30,
    agent_registration_date: "",
    agent_expiry_date: "",
    us_agent_id: "",
    registration_years: 2,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: facilitiesData } = await supabase
      .from("facilities")
      .select("id, name, facility_type, location_code, address, company_id")
      .order("name")

    if (facilitiesData) setFacilities(facilitiesData)

    const { data: usAgentsData } = await supabase
      .from("us_agents")
      .select("id, agent_name, email, phone, company_id")
      .order("agent_name")

    if (usAgentsData) setUsAgents(usAgentsData)

    const { data: registrationsData } = await supabase
      .from("fda_registrations")
      .select(
        `
        *,
        facilities (
          name,
          location_code,
          facility_type,
          address,
          company_id
        ),
        us_agents (
          agent_name,
          email
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (registrationsData) {
      const mapped = registrationsData.map((reg: any) => ({
        ...reg,
        facility_name: reg.facilities?.name,
        facility_code: reg.facilities?.location_code,
        facility_type: reg.facilities?.facility_type,
        facility_address: reg.facilities?.address,
        agent_name: reg.us_agents?.agent_name,
        agent_email: reg.us_agents?.email,
      }))
      setRegistrations(mapped)
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      facility_id: "",
      fda_registration_number: "",
      registration_status: "pending",
      registration_date: "",
      expiry_date: "",
      renewal_date: "",
      fei_number: "",
      duns_number: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
      last_inspection_date: "",
      next_inspection_date: "",
      notification_enabled: true,
      notification_days_before: 30,
      agent_registration_date: "",
      agent_expiry_date: "",
      us_agent_id: "",
      registration_years: 2,
    })
    setEditingId(null)
  }

  const handleOpenDialog = (registration?: FDARegistration) => {
    if (registration) {
      setEditingId(registration.id)
      setFormData({
        ...registration,
        us_agent_id: registration.us_agents?.id || "",
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleEdit = (registration: FDARegistration) => {
    setEditingId(registration.id)
    if (registration) {
      setFormData({
        facility_id: registration.facility_id || "",
        fda_registration_number: registration.fda_registration_number || "",
        registration_status: registration.registration_status || "active",
        registration_date: registration.registration_date || "",
        expiry_date: registration.expiry_date || "",
        renewal_date: registration.renewal_date || "",
        fei_number: registration.fei_number || "",
        duns_number: registration.duns_number || "",
        contact_name: registration.contact_name || "",
        contact_email: registration.contact_email || "",
        contact_phone: registration.contact_phone || "",
        notes: registration.notes || "",
        last_inspection_date: registration.last_inspection_date || "",
        next_inspection_date: registration.next_inspection_date || "",
        notification_enabled: registration.notification_enabled ?? true,
        notification_days_before: registration.notification_days_before || 30,
        agent_registration_date: registration.agent_registration_date || "",
        agent_expiry_date: registration.agent_expiry_date || "",
        us_agent_id: registration.us_agent_id || "",
        registration_years: registration.agent_registration_years || 1,
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    const {
      facility_id,
      fda_registration_number,
      registration_status,
      registration_date,
      expiry_date,
      renewal_date,
      fei_number,
      duns_number,
      contact_name,
      contact_email,
      contact_phone,
      notes,
      last_inspection_date,
      next_inspection_date,
      notification_enabled,
      notification_days_before,
      agent_registration_date,
      agent_expiry_date,
      us_agent_id,
      registration_years,
    } = formData

    if (!facility_id || !contact_name || !contact_email || !contact_phone) {
      toast({
        variant: "destructive",
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const data = {
      facility_id,
      fda_registration_number: fda_registration_number || null,
      registration_status,
      registration_date: registration_date || null,
      expiry_date: expiry_date || null,
      renewal_date: renewal_date || null,
      fei_number: fei_number || null,
      duns_number: duns_number || null,
      contact_name,
      contact_email,
      contact_phone,
      notes: notes || null,
      last_inspection_date: last_inspection_date || null,
      next_inspection_date: next_inspection_date || null,
      notification_enabled,
      notification_days_before,
      agent_registration_date: agent_registration_date || null,
      agent_expiry_date: agent_expiry_date || null,
      us_agent_id: us_agent_id || null,
      updated_at: new Date().toISOString(),
    }

    let error

    if (editingId) {
      const result = await supabase.from("fda_registrations").update(data).eq("id", editingId)
      error = result.error
    } else {
      const result = await supabase.from("fda_registrations").insert(data)
      error = result.error
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi lưu dữ liệu",
        description: error.message,
      })
      setIsSaving(false)
      return
    }

    toast({
      title: editingId ? "Cập nhật thành công" : "Tạo đăng ký FDA thành công",
      description: editingId ? "Thông tin đăng ký đã được cập nhật" : "Đã thêm đăng ký FDA mới",
    })

    setShowDialog(false)
    resetForm()
    loadData()
    setIsSaving(false)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "Đang chờ", className: "bg-yellow-100 text-yellow-700" },
      active: { label: "Đang hoạt động", className: "bg-green-100 text-green-700" },
      expired: { label: "Hết hạn", className: "bg-red-100 text-red-700" },
      cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-700" },
    }
    return config[status] || config.pending
  }

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryWarning = (expiryDate: string | null, notificationDaysBefore: number) => {
    const days = getDaysUntilExpiry(expiryDate)
    if (days === null) return null

    if (days < 0) {
      return { type: "expired", message: `Đã hết hạn ${Math.abs(days)} ngày trước`, className: "text-red-600" }
    } else if (days <= notificationDaysBefore) {
      return {
        type: "warning",
        message: `Sắp hết hạn (còn ${days} ngày)`,
        className: "text-amber-600",
      }
    }
    return null
  }

  const upcomingExpirations = registrations.filter((reg) => {
    const days = getDaysUntilExpiry(reg.expiry_date)
    return days !== null && days > 0 && days <= reg.notification_days_before
  })

  const expiredRegistrations = registrations.filter((reg) => {
    const days = getDaysUntilExpiry(reg.expiry_date)
    return days !== null && days < 0
  })

  const calculateFdaExpiryDate = (registrationDateStr: string) => {
    if (!registrationDateStr) return ""
    const regDate = new Date(registrationDateStr)
    const regYear = regDate.getFullYear()

    // FDA facility registration expires at the end of the next even year
    let expiryYear = regYear
    if (expiryYear % 2 === 1) {
      // Odd year - expires end of next year (even year)
      expiryYear += 1
    } else {
      // Even year - expires end of year after next
      expiryYear += 2
    }

    return `${expiryYear}-12-31`
  }

  const calculateAgentExpiryDate = (registrationDate: string, years: number) => {
    if (!registrationDate || !years) return ""
    const date = new Date(registrationDate)
    date.setFullYear(date.getFullYear() + years)
    return date.toISOString().split("T")[0]
  }

  useEffect(() => {
    if (formData.registration_date) {
      const newExpiryDate = calculateFdaExpiryDate(formData.registration_date)
      setFormData((prev) => ({ ...prev, expiry_date: newExpiryDate }))
    }
  }, [formData.registration_date])

  useEffect(() => {
    if (formData.agent_registration_date && formData.registration_years) {
      const newAgentExpiryDate = calculateAgentExpiryDate(formData.agent_registration_date, formData.registration_years)
      setFormData((prev) => ({ ...prev, agent_expiry_date: newAgentExpiryDate }))
    }
  }, [formData.agent_registration_date, formData.registration_years])

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

  return (
    <div className="p-8 space-y-6" data-tour="fda-registration">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đăng ký FDA</h1>
          <p className="text-muted-foreground">Tạo và quản lý đăng ký FDA cho các cơ sở của người dùng</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>Tạo đăng ký FDA mới</Button>
      </div>

      {(upcomingExpirations.length > 0 || expiredRegistrations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredRegistrations.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Đã hết hạn ({expiredRegistrations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {expiredRegistrations.slice(0, 3).map((reg) => (
                    <li key={reg.id} className="text-sm">
                      <span className="font-medium">{reg.facility_name}</span>
                      <span className="text-red-600 ml-2">
                        {getExpiryWarning(reg.expiry_date, reg.notification_days_before)?.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {upcomingExpirations.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-700 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Sắp hết hạn ({upcomingExpirations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {upcomingExpirations.slice(0, 3).map((reg) => (
                    <li key={reg.id} className="text-sm">
                      <span className="font-medium">{reg.facility_name}</span>
                      <span className="text-amber-600 ml-2">
                        {getExpiryWarning(reg.expiry_date, reg.notification_days_before)?.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đăng ký FDA ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cơ sở</TableHead>
                <TableHead>Mã Cơ sở</TableHead>
                <TableHead>Số đăng ký FDA</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày hết hạn FDA</TableHead>
                <TableHead>Đại diện Mỹ</TableHead>
                <TableHead>Ngày hết hạn Agent</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => {
                const warning = getExpiryWarning(reg.expiry_date, reg.notification_days_before)
                const agentWarning = reg.agent_expiry_date
                  ? getExpiryWarning(reg.agent_expiry_date, reg.notification_days_before)
                  : null
                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      <div>{reg.facility_name}</div>
                      <div className="text-xs text-muted-foreground">{reg.facility_address}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{reg.facility_code}</Badge>
                    </TableCell>
                    <TableCell>{reg.fda_registration_number || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(reg.registration_status).className}>
                        {getStatusBadge(reg.registration_status).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reg.expiry_date ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(reg.expiry_date).toLocaleDateString("vi-VN")}</span>
                          {warning && (
                            <Badge variant="outline" className={warning.className}>
                              {warning.type === "expired" ? "Hết hạn" : "Sắp hết hạn"}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.agent_name ? (
                        <div className="text-sm">
                          <div className="font-medium">{reg.agent_name}</div>
                          <div className="text-muted-foreground">{reg.agent_email}</div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Chưa có
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.agent_expiry_date ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(reg.agent_expiry_date).toLocaleDateString("vi-VN")}</span>
                          {agentWarning && (
                            <Badge variant="outline" className={agentWarning.className}>
                              {agentWarning.type === "expired" ? "⚠️ Hết hạn" : "⏰ Sắp hết"}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          ⚠️ Chưa đăng ký
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(reg)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh sửa đăng ký FDA" : "Thêm đăng ký FDA mới"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Cập nhật thông tin đăng ký FDA" : "Chọn cơ sở và nhập thông tin đăng ký FDA"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cơ sở *</Label>
              <Select
                value={formData.facility_id}
                onValueChange={(value) => setFormData({ ...formData, facility_id: value })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cơ sở" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name} ({facility.location_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Đăng ký cơ sở với FDA</h3>
              <p className="text-sm text-muted-foreground">
                Đăng ký FDA có thời hạn 2 năm và tự động gia hạn đến cuối năm chẵn tiếp theo
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số đăng ký FDA</Label>
                  <Input
                    value={formData.fda_registration_number || ""}
                    onChange={(e) => setFormData({ ...formData, fda_registration_number: e.target.value })}
                    placeholder="VD: FDA-VNT-REG-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={formData.registration_status}
                    onValueChange={(value) => setFormData({ ...formData, registration_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Đang chờ</SelectItem>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="expired">Hết hạn</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày đăng ký FDA *</Label>
                  <Input
                    type="date"
                    value={formData.registration_date || ""}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Nhập năm đăng ký. VD: 2025 → Hết hạn 31/12/2026</p>
                </div>
                <div className="space-y-2">
                  <Label>Ngày hết hạn FDA</Label>
                  <Input type="date" value={formData.expiry_date || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Tự động tính đến cuối năm chẵn tiếp theo (thời hạn 2 năm)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>FEI Number</Label>
                  <Input
                    value={formData.fei_number || ""}
                    onChange={(e) => setFormData({ ...formData, fei_number: e.target.value })}
                    placeholder="10-digit FEI number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>DUNS Number</Label>
                  <Input
                    value={formData.duns_number || ""}
                    onChange={(e) => setFormData({ ...formData, duns_number: e.target.value })}
                    placeholder="9-digit DUNS number"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Đăng ký cơ sở với US Agent</h3>
              <p className="text-sm text-muted-foreground">Chọn US Agent và số năm đăng ký (thông thường 1-5 năm)</p>

              <div className="space-y-2">
                <Label>US Agent</Label>
                <Select
                  value={formData.us_agent_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, us_agent_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn US Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {usAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.agent_name} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Chọn US Agent để gán cho đăng ký FDA này. Có thể cập nhật sau.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày đăng ký với Agent</Label>
                  <Input
                    type="date"
                    value={formData.agent_registration_date || ""}
                    onChange={(e) => setFormData({ ...formData, agent_registration_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số năm đăng ký Agent</Label>
                  <Select
                    value={String(formData.registration_years || 2)}
                    onValueChange={(value) => setFormData({ ...formData, registration_years: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 năm</SelectItem>
                      <SelectItem value="2">2 năm</SelectItem>
                      <SelectItem value="3">3 năm</SelectItem>
                      <SelectItem value="5">5 năm</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Thời hạn đăng ký với Agent (thông thường là 2 năm)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ngày hết hạn đăng ký Agent</Label>
                <Input type="date" value={formData.agent_expiry_date || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Tự động tính từ ngày đăng ký + số năm</p>
              </div>
            </div>

            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3. Thông tin liên hệ</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên liên hệ *</Label>
                  <Input
                    value={formData.contact_name || ""}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Họ tên người liên hệ"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.contact_email || ""}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại *</Label>
                  <Input
                    value={formData.contact_phone || ""}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Input
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú bổ sung (tùy chọn)"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
