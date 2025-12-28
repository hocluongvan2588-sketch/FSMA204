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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, AlertCircle, Bell, Star, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Lock } from "lucide-react"

interface USAgent {
  id: string
  company_id: string
  agent_name: string
  agent_company_name: string | null
  agent_type: string
  email: string
  phone: string
  fax: string | null
  street_address: string
  city: string
  state: string
  zip_code: string
  country: string
  service_start_date: string
  service_end_date: string | null
  contract_status: string
  notification_enabled: boolean
  notification_days_before: number
  contract_document_url: string | null
  authorization_letter_url: string | null
  notes: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export default function USAgentsPage() {
  const { toast } = useToast()
  const [agents, setAgents] = useState<USAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form states
  const [agentName, setAgentName] = useState("")
  const [agentCompanyName, setAgentCompanyName] = useState("")
  const [agentType, setAgentType] = useState("individual")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fax, setFax] = useState("")
  const [streetAddress, setStreetAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [serviceStartDate, setServiceStartDate] = useState("")
  const [serviceEndDate, setServiceEndDate] = useState("")
  const [contractStatus, setContractStatus] = useState("active")
  const [notes, setNotes] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [notificationDaysBefore, setNotificationDaysBefore] = useState(60)

  // Permission state
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkPermissionAndLoadData()
  }, [])

  const checkPermissionAndLoadData = async () => {
    setIsCheckingPermission(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setIsCheckingPermission(false)
      return
    }

    const { data: profile } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).single()

    if (!profile?.company_id) {
      setIsCheckingPermission(false)
      return
    }

    setUserRole(profile.role)

    // Check feature access via API
    const response = await fetch(`/api/check-feature-access?companyId=${profile.company_id}&feature=us_agent`)
    const { hasAccess: accessGranted } = await response.json()

    setHasAccess(accessGranted)
    setIsCheckingPermission(false)

    if (accessGranted) {
      loadData()
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: agentsData } = await supabase.from("us_agents").select("*").order("is_primary", { ascending: false })

    if (agentsData) setAgents(agentsData)
    setIsLoading(false)
  }

  const resetForm = () => {
    setAgentName("")
    setAgentCompanyName("")
    setAgentType("individual")
    setEmail("")
    setPhone("")
    setFax("")
    setStreetAddress("")
    setCity("")
    setState("")
    setZipCode("")
    setServiceStartDate("")
    setServiceEndDate("")
    setContractStatus("active")
    setNotes("")
    setIsPrimary(false)
    setNotificationEnabled(true)
    setNotificationDaysBefore(60)
    setEditingId(null)
  }

  const handleOpenDialog = (agent?: USAgent) => {
    if (userRole !== "system_admin") {
      toast({
        variant: "destructive",
        title: "Quyền truy cập bị từ chối",
        description: "Chỉ System Administrator mới có thể tạo/chỉnh sửa US Agent",
      })
      return
    }

    if (agent) {
      setEditingId(agent.id)
      setAgentName(agent.agent_name)
      setAgentCompanyName(agent.agent_company_name || "")
      setAgentType(agent.agent_type)
      setEmail(agent.email)
      setPhone(agent.phone)
      setFax(agent.fax || "")
      setStreetAddress(agent.street_address)
      setCity(agent.city)
      setState(agent.state)
      setZipCode(agent.zip_code)
      setServiceStartDate(agent.service_start_date)
      setServiceEndDate(agent.service_end_date || "")
      setContractStatus(agent.contract_status)
      setNotes(agent.notes || "")
      setIsPrimary(agent.is_primary)
      setNotificationEnabled(agent.notification_enabled)
      setNotificationDaysBefore(agent.notification_days_before)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!agentName || !email || !phone || !streetAddress || !city || !state || !zipCode || !serviceStartDate) {
      toast({
        variant: "destructive",
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    // Get current user's company
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single()

    if (!profile?.company_id) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Bạn chưa được gán vào công ty nào",
      })
      setIsSaving(false)
      return
    }

    const data = {
      company_id: profile.company_id,
      agent_name: agentName,
      agent_company_name: agentCompanyName || null,
      agent_type: agentType,
      email: email,
      phone: phone,
      fax: fax || null,
      street_address: streetAddress,
      city: city,
      state: state,
      zip_code: zipCode,
      country: "USA",
      service_start_date: serviceStartDate,
      service_end_date: serviceEndDate || null,
      contract_status: contractStatus,
      notes: notes || null,
      is_primary: isPrimary,
      notification_enabled: notificationEnabled,
      notification_days_before: notificationDaysBefore,
      updated_at: new Date().toISOString(),
    }

    let error

    if (editingId) {
      const result = await supabase.from("us_agents").update(data).eq("id", editingId)
      error = result.error
    } else {
      const result = await supabase.from("us_agents").insert(data)
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
      title: editingId ? "Cập nhật thành công" : "Thêm US Agent thành công",
      description: editingId ? "Thông tin đại lý đã được cập nhật" : "Đã thêm đại lý Mỹ mới",
    })

    setShowDialog(false)
    resetForm()
    loadData()
    setIsSaving(false)
  }

  const handleDelete = async (id: string, agentName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đại lý ${agentName}?`)) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("us_agents").delete().eq("id", id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi xóa đại lý",
        description: error.message,
      })
      return
    }

    toast({
      title: "Xóa thành công",
      description: `Đã xóa đại lý ${agentName}`,
    })

    loadData()
  }

  const handleSetPrimary = async (id: string) => {
    const supabase = createClient()

    // Unset all primary
    await supabase.from("us_agents").update({ is_primary: false }).neq("id", id)

    // Set new primary
    const { error } = await supabase.from("us_agents").update({ is_primary: true }).eq("id", id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      })
      return
    }

    toast({
      title: "Đặt làm đại lý chính",
      description: "Đã cập nhật đại lý chính thành công",
    })

    loadData()
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Đang hoạt động", className: "bg-green-100 text-green-700" },
      expired: { label: "Hết hạn", className: "bg-red-100 text-red-700" },
      cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-700" },
    }
    return config[status] || config.active
  }

  const getDaysUntilExpiry = (endDate: string | null) => {
    if (!endDate) return null
    const today = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryWarning = (endDate: string | null, notificationDaysBefore: number) => {
    const days = getDaysUntilExpiry(endDate)
    if (days === null) return null

    if (days < 0) {
      return { type: "expired", message: `Hết hạn ${Math.abs(days)} ngày trước`, className: "text-red-600" }
    } else if (days <= notificationDaysBefore) {
      return {
        type: "warning",
        message: `Sắp hết hạn (còn ${days} ngày)`,
        className: "text-amber-600",
      }
    }
    return null
  }

  const upcomingExpirations = agents.filter((agent) => {
    const days = getDaysUntilExpiry(agent.service_end_date)
    return days !== null && days > 0 && days <= agent.notification_days_before
  })

  const expiredAgents = agents.filter((agent) => {
    const days = getDaysUntilExpiry(agent.service_end_date)
    return days !== null && days < 0
  })

  const primaryAgent = agents.find((a) => a.is_primary)

  if (isCheckingPermission) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý US Agent</h1>
          <p className="text-muted-foreground mt-1">Quản lý đại lý Mỹ cho xuất khẩu thực phẩm vào Hoa Kỳ</p>
        </div>

        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Lock className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">Tính năng cao cấp</AlertTitle>
          <AlertDescription className="text-blue-700">
            <p className="mb-3">
              Quản lý US Agent là tính năng dành cho gói <strong>Professional</strong> trở lên. Tính năng này cho phép
              bạn:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Quản lý thông tin đại lý Mỹ (US Agent)</li>
              <li>Theo dõi hợp đồng và ngày hết hạn</li>
              <li>Nhận thông báo tự động khi sắp hết hạn</li>
              <li>Tuân thủ yêu cầu FDA cho xuất khẩu thực phẩm</li>
            </ul>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/pricing">Nâng cấp ngay</Link>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Show blurred preview */}
        <Card className="opacity-60 pointer-events-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Xem trước tính năng (Yêu cầu nâng cấp)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="blur-sm h-64 bg-slate-100 rounded-lg"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý US Agent</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "system_admin"
              ? "Quản lý đại lý Mỹ cho xuất khẩu thực phẩm vào Hoa Kỳ"
              : "Xem thông tin đại lý Mỹ (chỉ System Admin mới có thể tạo/chỉnh sửa)"}
          </p>
        </div>
        {userRole === "system_admin" && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm US Agent
          </Button>
        )}
      </div>

      {userRole !== "system_admin" && (
        <Alert className="border-blue-200 bg-blue-50">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertDescription className="ml-2 text-sm text-blue-900">
            Bạn chỉ có quyền <strong>xem</strong> danh sách US Agent. Để tạo hoặc chỉnh sửa, vui lòng liên hệ System
            Administrator.
          </AlertDescription>
        </Alert>
      )}

      {primaryAgent && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Star className="h-5 w-5 fill-blue-700" />
              Đại lý chính
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tên đại lý</p>
              <p className="font-medium">{primaryAgent.agent_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{primaryAgent.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Điện thoại</p>
              <p className="font-medium">{primaryAgent.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
              <p className="font-medium">
                {primaryAgent.city}, {primaryAgent.state}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(upcomingExpirations.length > 0 || expiredAgents.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredAgents.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Hợp đồng hết hạn ({expiredAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {expiredAgents.slice(0, 3).map((agent) => (
                    <li key={agent.id} className="text-sm">
                      <span className="font-medium">{agent.agent_name}</span>
                      <span className="text-red-600 ml-2">
                        {getExpiryWarning(agent.service_end_date, agent.notification_days_before)?.message}
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
                  {upcomingExpirations.slice(0, 3).map((agent) => (
                    <li key={agent.id} className="text-sm">
                      <span className="font-medium">{agent.agent_name}</span>
                      <span className="text-amber-600 ml-2">
                        {getExpiryWarning(agent.service_end_date, agent.notification_days_before)?.message}
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
          <CardTitle>Danh sách US Agent ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đại lý</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Hợp đồng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const warning = getExpiryWarning(agent.service_end_date, agent.notification_days_before)
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {agent.is_primary && <Star className="h-4 w-4 fill-blue-600 text-blue-600" />}
                        <div>
                          <div className="font-medium">{agent.agent_name}</div>
                          {agent.agent_company_name && (
                            <div className="text-xs text-muted-foreground">{agent.agent_company_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{agent.agent_type}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{agent.email}</div>
                        <div className="text-muted-foreground">{agent.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {agent.city}, {agent.state} {agent.zip_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.service_end_date ? (
                        <div className="text-sm">
                          <div>{new Date(agent.service_end_date).toLocaleDateString("vi-VN")}</div>
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
                      <Badge className={getStatusBadge(agent.contract_status).className}>
                        {getStatusBadge(agent.contract_status).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!agent.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(agent.id)}
                            title="Đặt làm đại lý chính"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {userRole === "system_admin" && (
                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(agent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {userRole === "system_admin" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(agent.id, agent.agent_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {userRole === "system_admin" && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Chỉnh sửa US Agent" : "Thêm US Agent mới"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Cập nhật thông tin đại lý Mỹ" : "Nhập thông tin đại lý Mỹ cho xuất khẩu"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="address">Địa chỉ</TabsTrigger>
                <TabsTrigger value="contract">Hợp đồng</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agentName">Tên đại lý *</Label>
                    <Input
                      id="agentName"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Tên cá nhân hoặc công ty"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agentCompanyName">Tên công ty</Label>
                    <Input
                      id="agentCompanyName"
                      value={agentCompanyName}
                      onChange={(e) => setAgentCompanyName(e.target.value)}
                      placeholder="Tên công ty đại lý (nếu có)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agentType">Loại đại lý *</Label>
                    <Select value={agentType} onValueChange={setAgentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Cá nhân</SelectItem>
                        <SelectItem value="company">Công ty</SelectItem>
                        <SelectItem value="law_firm">Văn phòng luật</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Điện thoại *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (xxx) xxx-xxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fax">Fax</Label>
                    <Input
                      id="fax"
                      type="tel"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      placeholder="+1 (xxx) xxx-xxxx"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Đặt làm đại lý chính</Label>
                    <p className="text-sm text-muted-foreground">Đại lý chính sẽ được hiển thị ưu tiên</p>
                  </div>
                  <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="streetAddress">Địa chỉ *</Label>
                    <Input
                      id="streetAddress"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Số nhà, tên đường"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Thành phố *</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Bang *</Label>
                    <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Quốc gia</Label>
                    <Input id="country" value="USA" disabled />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceStartDate">Ngày bắt đầu hợp đồng *</Label>
                    <Input
                      id="serviceStartDate"
                      type="date"
                      value={serviceStartDate}
                      onChange={(e) => setServiceStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceEndDate">Ngày kết thúc hợp đồng</Label>
                    <Input
                      id="serviceEndDate"
                      type="date"
                      value={serviceEndDate}
                      onChange={(e) => setServiceEndDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractStatus">Trạng thái hợp đồng</Label>
                    <Select value={contractStatus} onValueChange={setContractStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Đang hoạt động</SelectItem>
                        <SelectItem value="expired">Hết hạn</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Thông tin bổ sung về hợp đồng..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bật thông báo tự động</Label>
                      <p className="text-sm text-muted-foreground">Nhận email nhắc nhở trước khi hợp đồng hết hạn</p>
                    </div>
                    <Switch checked={notificationEnabled} onCheckedChange={setNotificationEnabled} />
                  </div>

                  {notificationEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="notificationDaysBefore">Thông báo trước (ngày)</Label>
                      <Input
                        id="notificationDaysBefore"
                        type="number"
                        min="1"
                        max="365"
                        value={notificationDaysBefore}
                        onChange={(e) => setNotificationDaysBefore(Number.parseInt(e.target.value) || 60)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Hệ thống sẽ gửi email nhắc nhở {notificationDaysBefore} ngày trước khi hết hạn
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

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
      )}
    </div>
  )
}
