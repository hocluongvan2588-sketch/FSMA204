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
import { Plus, Edit, Trash2, AlertCircle, Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  created_at: string
  updated_at: string
  facility_name?: string
}

interface Facility {
  id: string
  name: string
  facility_type: string
  location_code: string
}

export default function FDARegistrationsPage() {
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<FDARegistration[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [facilityId, setFacilityId] = useState("")
  const [fdaNumber, setFdaNumber] = useState("")
  const [status, setStatus] = useState("pending")
  const [registrationDate, setRegistrationDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [renewalDate, setRenewalDate] = useState("")
  const [feiNumber, setFeiNumber] = useState("")
  const [dunsNumber, setDunsNumber] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [lastInspectionDate, setLastInspectionDate] = useState("")
  const [nextInspectionDate, setNextInspectionDate] = useState("")
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [notificationDaysBefore, setNotificationDaysBefore] = useState(30)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Load facilities
    const { data: facilitiesData } = await supabase
      .from("facilities")
      .select("id, name, facility_type, location_code")
      .order("name")

    if (facilitiesData) setFacilities(facilitiesData)

    // Load FDA registrations with facility names
    const { data: registrationsData } = await supabase
      .from("fda_registrations")
      .select(
        `
        *,
        facilities (name)
      `,
      )
      .order("created_at", { ascending: false })

    if (registrationsData) {
      const mapped = registrationsData.map((reg: any) => ({
        ...reg,
        facility_name: reg.facilities?.name,
      }))
      setRegistrations(mapped)
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setFacilityId("")
    setFdaNumber("")
    setStatus("pending")
    setRegistrationDate("")
    setExpiryDate("")
    setRenewalDate("")
    setFeiNumber("")
    setDunsNumber("")
    setContactName("")
    setContactEmail("")
    setContactPhone("")
    setNotes("")
    setLastInspectionDate("")
    setNextInspectionDate("")
    setNotificationEnabled(true)
    setNotificationDaysBefore(30)
    setEditingId(null)
  }

  const handleOpenDialog = (registration?: FDARegistration) => {
    if (registration) {
      setEditingId(registration.id)
      setFacilityId(registration.facility_id)
      setFdaNumber(registration.fda_registration_number || "")
      setStatus(registration.registration_status)
      setRegistrationDate(registration.registration_date || "")
      setExpiryDate(registration.expiry_date || "")
      setRenewalDate(registration.renewal_date || "")
      setFeiNumber(registration.fei_number || "")
      setDunsNumber(registration.duns_number || "")
      setContactName(registration.contact_name)
      setContactEmail(registration.contact_email)
      setContactPhone(registration.contact_phone)
      setNotes(registration.notes || "")
      setLastInspectionDate(registration.last_inspection_date || "")
      setNextInspectionDate(registration.next_inspection_date || "")
      setNotificationEnabled(registration.notification_enabled)
      setNotificationDaysBefore(registration.notification_days_before)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!facilityId || !contactName || !contactEmail || !contactPhone) {
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
      facility_id: facilityId,
      fda_registration_number: fdaNumber || null,
      registration_status: status,
      registration_date: registrationDate || null,
      expiry_date: expiryDate || null,
      renewal_date: renewalDate || null,
      fei_number: feiNumber || null,
      duns_number: dunsNumber || null,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      notes: notes || null,
      last_inspection_date: lastInspectionDate || null,
      next_inspection_date: nextInspectionDate || null,
      notification_enabled: notificationEnabled,
      notification_days_before: notificationDaysBefore,
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

  const handleDelete = async (id: string, facilityName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đăng ký FDA của ${facilityName}?`)) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("fda_registrations").delete().eq("id", id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi xóa đăng ký",
        description: error.message,
      })
      return
    }

    toast({
      title: "Xóa thành công",
      description: `Đã xóa đăng ký FDA của ${facilityName}`,
    })

    loadData()
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đăng ký FDA</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và quản lý đăng ký FDA cho các cơ sở của bạn</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm đăng ký FDA
        </Button>
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
                <TableHead>Số đăng ký FDA</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày hết hạn</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => {
                const warning = getExpiryWarning(reg.expiry_date, reg.notification_days_before)
                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.facility_name}</TableCell>
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
                      <div className="text-sm">
                        <div>{reg.contact_name}</div>
                        <div className="text-muted-foreground">{reg.contact_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(reg)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(reg.id, reg.facility_name || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
              {editingId ? "Cập nhật thông tin đăng ký FDA" : "Nhập thông tin đăng ký FDA cho cơ sở"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="notifications">Thông báo</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facility">Cơ sở *</Label>
                  <Select value={facilityId} onValueChange={setFacilityId}>
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

                <div className="space-y-2">
                  <Label htmlFor="fdaNumber">Số đăng ký FDA</Label>
                  <Input
                    id="fdaNumber"
                    value={fdaNumber}
                    onChange={(e) => setFdaNumber(e.target.value)}
                    placeholder="FDA Registration Number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái *</Label>
                  <Select value={status} onValueChange={setStatus}>
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

                <div className="space-y-2">
                  <Label htmlFor="registrationDate">Ngày đăng ký</Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renewalDate">Ngày gia hạn</Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feiNumber">FEI Number</Label>
                  <Input
                    id="feiNumber"
                    value={feiNumber}
                    onChange={(e) => setFeiNumber(e.target.value)}
                    placeholder="Food Facility Establishment ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dunsNumber">DUNS Number</Label>
                  <Input
                    id="dunsNumber"
                    value={dunsNumber}
                    onChange={(e) => setDunsNumber(e.target.value)}
                    placeholder="Data Universal Numbering System"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Tên người liên hệ *</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Họ và tên"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email liên hệ *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Số điện thoại liên hệ *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastInspectionDate">Ngày kiểm tra cuối</Label>
                  <Input
                    id="lastInspectionDate"
                    type="date"
                    value={lastInspectionDate}
                    onChange={(e) => setLastInspectionDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thông tin bổ sung..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bật thông báo tự động</Label>
                    <p className="text-sm text-muted-foreground">Nhận email nhắc nhở trước khi đăng ký hết hạn</p>
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
                      onChange={(e) => setNotificationDaysBefore(Number.parseInt(e.target.value) || 30)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Hệ thống sẽ gửi email nhắc nhở {notificationDaysBefore} ngày trước khi hết hạn
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="nextInspectionDate">Ngày kiểm tra tiếp theo</Label>
                  <Input
                    id="nextInspectionDate"
                    type="date"
                    value={nextInspectionDate}
                    onChange={(e) => setNextInspectionDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Hệ thống cũng sẽ gửi nhắc nhở trước ngày kiểm tra</p>
                </div>
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
    </div>
  )
}
