"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Plus, Calendar, Package } from "lucide-react"
import { isSystemAdmin } from "@/lib/auth/roles"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface Company {
  id: string
  name: string
}

interface ServicePackage {
  id: string
  package_name: string
  package_name_vi: string
  package_code: string
  price_monthly: number
  price_yearly: number
}

interface Subscription {
  id: string
  company_id: string
  package_id: string
  start_date: string
  end_date: string
  status: string
  price_paid: number
  payment_frequency: string
  companies?: Company
  service_packages?: ServicePackage
}

export default function AdminSubscriptionsPage() {
  const { language } = useLanguage()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    company_id: "",
    package_id: "",
    start_date: new Date().toISOString().split("T")[0],
    payment_frequency: "monthly" as "monthly" | "yearly",
    duration_months: 1,
  })

  useEffect(() => {
    loadCurrentUser()
    loadData()
  }, [])

  const loadCurrentUser = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
      setCurrentUserProfile(profile)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const [subsRes, companiesRes, packagesRes] = await Promise.all([
        supabase
          .from("company_subscriptions")
          .select(`
            *,
            companies(id, name),
            service_packages(id, package_name, package_name_vi, package_code, price_monthly, price_yearly)
          `)
          .order("created_at", { ascending: false }),
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("service_packages").select("*").eq("is_active", true).order("sort_order"),
      ])

      if (subsRes.error) throw subsRes.error
      if (companiesRes.error) throw companiesRes.error
      if (packagesRes.error) throw packagesRes.error

      setSubscriptions(subsRes.data || [])
      setCompanies(companiesRes.data || [])
      setPackages(packagesRes.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        variant: "destructive",
        title: language === "vi" ? "Lỗi tải dữ liệu" : "Error loading data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!formData.company_id || !formData.package_id) {
      toast({
        variant: "destructive",
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Vui lòng chọn công ty và gói dịch vụ" : "Please select company and package",
      })
      return
    }

    const supabase = createClient()

    try {
      const selectedPackage = packages.find((p) => p.id === formData.package_id)
      if (!selectedPackage) throw new Error("Package not found")

      const startDate = new Date(formData.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + formData.duration_months)

      const pricePaid =
        formData.payment_frequency === "monthly"
          ? selectedPackage.price_monthly * formData.duration_months
          : selectedPackage.price_yearly

      const { error } = await supabase.from("company_subscriptions").insert([
        {
          company_id: formData.company_id,
          package_id: formData.package_id,
          start_date: formData.start_date,
          end_date: endDate.toISOString().split("T")[0],
          status: "active",
          price_paid: pricePaid,
          payment_frequency: formData.payment_frequency,
        },
      ])

      if (error) throw error

      toast({
        title: language === "vi" ? "✅ Tạo đăng ký thành công" : "✅ Subscription created",
        description:
          language === "vi" ? "Đăng ký mới đã được tạo thành công" : "New subscription has been created successfully",
      })

      setShowCreateDialog(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error creating subscription:", error)
      toast({
        variant: "destructive",
        title: language === "vi" ? "Lỗi tạo đăng ký" : "Error creating subscription",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      company_id: "",
      package_id: "",
      start_date: new Date().toISOString().split("T")[0],
      payment_frequency: "monthly",
      duration_months: 1,
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: language === "vi" ? "Đang hoạt động" : "Active", variant: "default" as const },
      expired: { label: language === "vi" ? "Đã hết hạn" : "Expired", variant: "destructive" as const },
      cancelled: { label: language === "vi" ? "Đã hủy" : "Cancelled", variant: "secondary" as const },
      pending: { label: language === "vi" ? "Chờ xử lý" : "Pending", variant: "outline" as const },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "outline" as const,
    }

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{language === "vi" ? "Đang tải..." : "Loading..."}</div>
      </div>
    )
  }

  if (!currentUserProfile || !isSystemAdmin(currentUserProfile.role)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">
            {language === "vi" ? "Bạn không có quyền truy cập trang này" : "You don't have access to this page"}
          </p>
        </div>
      </div>
    )
  }

  const activeCount = subscriptions.filter((s) => s.status === "active").length
  const expiredCount = subscriptions.filter((s) => s.status === "expired").length
  const totalRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.price_paid || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{language === "vi" ? "Quản lý Đăng ký" : "Subscriptions"}</h1>
          <p className="text-muted-foreground mt-1">
            {language === "vi"
              ? "Quản lý đăng ký gói dịch vụ của các công ty"
              : "Manage company service package subscriptions"}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === "vi" ? "Thêm đăng ký" : "Add Subscription"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Tổng đăng ký" : "Total Subscriptions"}
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Đang hoạt động" : "Active"}
            </CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Đã hết hạn" : "Expired"}
            </CardTitle>
            <Calendar className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{expiredCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Doanh thu" : "Revenue"}
            </CardTitle>
            <span className="text-green-600 text-xl font-bold">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "vi" ? "Danh sách đăng ký" : "Subscription List"}</CardTitle>
          <CardDescription>
            {language === "vi"
              ? `${subscriptions.length} đăng ký trong hệ thống`
              : `${subscriptions.length} subscriptions in the system`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === "vi" ? "Chưa có đăng ký nào" : "No subscriptions yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "vi" ? "Công ty" : "Company"}</TableHead>
                  <TableHead>{language === "vi" ? "Gói dịch vụ" : "Package"}</TableHead>
                  <TableHead>{language === "vi" ? "Ngày bắt đầu" : "Start Date"}</TableHead>
                  <TableHead>{language === "vi" ? "Ngày kết thúc" : "End Date"}</TableHead>
                  <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                  <TableHead>{language === "vi" ? "Chu kỳ" : "Frequency"}</TableHead>
                  <TableHead className="text-right">{language === "vi" ? "Giá" : "Price"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.companies?.name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {sub.service_packages?.package_code}
                        </Badge>
                        <span className="text-sm">
                          {language === "vi"
                            ? sub.service_packages?.package_name_vi
                            : sub.service_packages?.package_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(sub.start_date), "dd/MM/yyyy", { locale: language === "vi" ? vi : undefined })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(sub.end_date), "dd/MM/yyyy", { locale: language === "vi" ? vi : undefined })}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sub.payment_frequency === "monthly"
                          ? language === "vi"
                            ? "Tháng"
                            : "Monthly"
                          : language === "vi"
                            ? "Năm"
                            : "Yearly"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${sub.price_paid?.toFixed(2) || "0.00"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && (setShowCreateDialog(false), resetForm())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Thêm đăng ký mới" : "Add New Subscription"}</DialogTitle>
            <DialogDescription>
              {language === "vi"
                ? "Tạo đăng ký gói dịch vụ cho công ty"
                : "Create a service package subscription for a company"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">{language === "vi" ? "Công ty" : "Company"} *</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "vi" ? "Chọn công ty" : "Select company"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package">{language === "vi" ? "Gói dịch vụ" : "Package"} *</Label>
              <Select
                value={formData.package_id}
                onValueChange={(value) => setFormData({ ...formData, package_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "vi" ? "Chọn gói dịch vụ" : "Select package"} />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{pkg.package_code}</span>
                        <span>{language === "vi" ? pkg.package_name_vi : pkg.package_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_frequency">
                {language === "vi" ? "Chu kỳ thanh toán" : "Payment Frequency"} *
              </Label>
              <Select
                value={formData.payment_frequency}
                onValueChange={(value: "monthly" | "yearly") => setFormData({ ...formData, payment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{language === "vi" ? "Theo tháng" : "Monthly"}</SelectItem>
                  <SelectItem value="yearly">{language === "vi" ? "Theo năm" : "Yearly"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">{language === "vi" ? "Ngày bắt đầu" : "Start Date"} *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">{language === "vi" ? "Thời hạn (tháng)" : "Duration (months)"} *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="36"
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
            >
              {language === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button onClick={handleCreateSubscription}>
              {language === "vi" ? "Tạo đăng ký" : "Create Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
