"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { UserRole, getRoleDisplayName, isSystemAdmin } from "@/lib/auth/roles"
import { createUser, createCompany, deleteUser } from "@/app/actions/admin-users"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Eye } from "lucide-react"

interface Profile {
  id: string
  full_name: string
  role: string
  email?: string
  phone: string | null
  created_at: string
  organization_type: string | null
}

export default function AdminUsersPage() {
  const { locale, t } = useLanguage()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState("")
  const [newCompanyRegistrationNumber, setNewCompanyRegistrationNumber] = useState("")
  const [newCompanyAddress, setNewCompanyAddress] = useState("")
  const [newCompanyPhone, setNewCompanyPhone] = useState("")
  const [newCompanyEmail, setNewCompanyEmail] = useState("")
  const [newCompanyContactPerson, setNewCompanyContactPerson] = useState("")
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)
  const [showEnvWarning, setShowEnvWarning] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("viewer")
  const [companyId, setCompanyId] = useState("")
  const [phone, setPhone] = useState("")
  const [organizationType, setOrganizationType] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSystemAdminConfirm, setShowSystemAdminConfirm] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadCurrentUser()
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
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    if (response.ok) {
      const data = await response.json()
      setProfiles(data.profiles || [])
      setCompanies(data.companies || [])
    } else {
      console.error("[v0] Failed to load users:", await response.text())
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (role === UserRole.SYSTEM_ADMIN) {
      setPendingFormData({ email, password, fullName, role, companyId, phone, organizationType })
      setShowSystemAdminConfirm(true)
      return
    }

    await executeCreateUser()
  }

  const executeCreateUser = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await createUser({
        email,
        password,
        fullName,
        role,
        companyId: companyId === "none" ? undefined : companyId,
        phone,
        organizationType: organizationType || undefined,
      })

      if (result.error) {
        if (result.error.includes("Service role key") || result.error.includes("SUPABASE_SERVICE_ROLE_KEY")) {
          setShowEnvWarning(true)
        }
        setError(result.error)
        toast({
          variant: "destructive",
          title: "❌ Lỗi tạo tài khoản",
          description: result.error,
        })
        return
      }

      setSuccess("Tạo tài khoản thành công!")
      const roleMessage =
        role === UserRole.SYSTEM_ADMIN
          ? "🔒 System Admin với toàn quyền hệ thống"
          : role === UserRole.ADMIN
            ? "👔 Admin có quyền quản trị công ty"
            : "👤 Người dùng thông thường"
      toast({
        title: "✅ Tạo tài khoản thành công!",
        description: `Đã tạo tài khoản cho ${fullName} (${email}) với vai trò ${roleMessage}`,
      })

      setEmail("")
      setPassword("")
      setFullName("")
      setRole("viewer")
      setCompanyId("")
      setPhone("")
      setOrganizationType("")
      setShowCreateForm(false)

      loadData()
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo tài khoản")
      toast({
        variant: "destructive",
        title: "❌ Lỗi không xác định",
        description: err.message || "Có lỗi xảy ra khi tạo tài khoản",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmSystemAdmin = async () => {
    setShowSystemAdminConfirm(false)
    await executeCreateUser()
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: "Vui lòng nhập tên công ty",
      })
      return
    }

    setIsCreatingCompany(true)
    try {
      const result = await createCompany({
        name: newCompanyName,
        registrationNumber: newCompanyRegistrationNumber,
        address: newCompanyAddress,
        phone: newCompanyPhone,
        email: newCompanyEmail,
        contactPerson: newCompanyContactPerson,
        displayName: newCompanyName,
      })

      if (result.error) {
        toast({
          variant: "destructive",
          title: "❌ Lỗi tạo công ty",
          description: result.error,
        })
        return
      }

      if (result.company) {
        setCompanyId(result.company.id)
        toast({
          title: "✅ Tạo công ty thành công!",
          description: `Đã tạo công ty ${newCompanyName}`,
        })
      }

      setNewCompanyName("")
      setNewCompanyRegistrationNumber("")
      setNewCompanyAddress("")
      setNewCompanyPhone("")
      setNewCompanyEmail("")
      setNewCompanyContactPerson("")
      setShowCreateCompany(false)
      await loadData()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo công ty",
      })
    } finally {
      setIsCreatingCompany(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản của ${userName}?`)) {
      return
    }

    try {
      const result = await deleteUser(userId)

      if (result.error) {
        setError(result.error)
        toast({
          variant: "destructive",
          title: "❌ Lỗi xóa tài khoản",
          description: result.error,
        })
        return
      }

      setSuccess("Xóa tài khoản thành công!")
      toast({
        title: "✅ Xóa tài khoản thành công!",
        description: `Đã xóa tài khoản của ${userName}`,
      })
      loadData()
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi xóa tài khoản")
      toast({
        variant: "destructive",
        title: "❌ Lỗi không xác định",
        description: err.message || "Có lỗi xảy ra khi xóa tài khoản",
      })
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      system_admin: "bg-purple-100 text-purple-700 border-purple-300",
      admin: "bg-red-100 text-red-700",
      manager: "bg-blue-100 text-blue-700",
      operator: "bg-green-100 text-green-700",
      viewer: "bg-gray-100 text-gray-700",
    }
    return colors[role] || colors.viewer
  }

  const getOrganizationBadge = (orgType: string | null) => {
    if (!orgType) return { label: "-", className: "bg-gray-100 text-gray-600" }

    const config: Record<string, { label: string; className: string }> = {
      farm: { label: "Farm", className: "bg-green-100 text-green-700" },
      packing_house: { label: "Packer", className: "bg-blue-100 text-blue-700" },
      processor: { label: "Processor", className: "bg-purple-100 text-purple-700" },
      distributor: { label: "Distributor", className: "bg-orange-100 text-orange-700" },
      retailer: { label: "Retailer", className: "bg-pink-100 text-pink-700" },
      importer: { label: "Importer", className: "bg-cyan-100 text-cyan-700" },
      port: { label: "Port", className: "bg-slate-100 text-slate-700" },
    }
    return config[orgType] || { label: orgType, className: "bg-gray-100 text-gray-600" }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">
            {currentUserProfile && isSystemAdmin(currentUserProfile.role)
              ? "Tạo và quản lý tất cả tài khoản người dùng trong hệ thống"
              : "Tạo và quản lý tài khoản người dùng trong công ty của bạn"}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Hủy" : "+ Tạo người dùng mới"}
        </Button>
      </div>

      {showEnvWarning && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-red-600 mt-1 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-lg">Thiếu cấu hình Environment Variable</h3>
              <p className="text-red-800 mt-2">
                Chức năng tạo người dùng yêu cầu{" "}
                <code className="bg-red-100 px-2 py-1 rounded font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</code>
              </p>
              <div className="mt-4 space-y-2 text-sm text-red-800">
                <p className="font-semibold">Để khắc phục:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Truy cập Supabase Dashboard → Settings → API</li>
                  <li>
                    Copy <strong>service_role</strong> key (secret)
                  </li>
                  <li>Thêm vào environment variables của project:</li>
                </ol>
                <div className="bg-red-900 text-red-50 p-3 rounded font-mono text-xs mt-2">
                  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
                </div>
                <p className="mt-2">
                  <strong>Local:</strong> Thêm vào file{" "}
                  <code className="bg-red-100 text-red-900 px-1 rounded">.env.local</code>
                  <br />
                  <strong>Production:</strong> Thêm vào Vercel Environment Variables
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href="https://supabase.com/dashboard/project/_/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-900 text-white px-4 py-2 rounded hover:bg-red-800 text-sm font-medium"
                >
                  Mở Supabase Dashboard
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <Button variant="outline" onClick={() => setShowEnvWarning(false)}>
                  Đã hiểu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentUserProfile && isSystemAdmin(currentUserProfile.role) && !showEnvWarning && (
        <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold">Bạn đang ở chế độ System Admin</p>
            <p className="text-sm">Bạn có thể xem và quản lý tất cả người dùng từ tất cả các công ty trong hệ thống.</p>
          </div>
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tạo tài khoản người dùng mới</CardTitle>
            <CardDescription>Điền thông tin để tạo tài khoản cho nhân viên</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {role === UserRole.SYSTEM_ADMIN && (
                <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="font-bold text-purple-900 text-lg">⚠️ Cảnh báo: Đang tạo SYSTEM ADMIN</p>
                      <p className="text-purple-800 mt-1 text-sm">
                        Vai trò này có toàn quyền truy cập hệ thống, có thể quản lý tất cả công ty và người dùng. Chỉ
                        cấp quyền này cho người đáng tin cậy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {role === UserRole.ADMIN && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">Vai trò được chọn: Admin</p>
                      <p className="text-amber-800 text-sm">Có quyền quản trị công ty và tạo người dùng.</p>
                    </div>
                  </div>
                </div>
              )}
              {role === UserRole.VIEWER && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">Vai trò được chọn: Viewer (Chỉ xem)</p>
                      <p className="text-blue-800 text-sm">Chỉ có quyền xem dữ liệu, không thể chỉnh sửa.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên *</Label>
                  <Input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    Vai trò *
                    {role === UserRole.SYSTEM_ADMIN && (
                      <Badge className="bg-purple-600 text-white">QUYỀN CAO NHẤT</Badge>
                    )}
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className={role === UserRole.SYSTEM_ADMIN ? "border-purple-500 border-2" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
                        <SelectItem value={UserRole.SYSTEM_ADMIN} className="bg-purple-50 font-bold">
                          🔒 {getRoleDisplayName(UserRole.SYSTEM_ADMIN, locale)} - Toàn quyền hệ thống
                        </SelectItem>
                      )}
                      <SelectItem value={UserRole.ADMIN}>
                        {getRoleDisplayName(UserRole.ADMIN, locale)} - Quản trị công ty
                      </SelectItem>
                      <SelectItem value={UserRole.MANAGER}>
                        {getRoleDisplayName(UserRole.MANAGER, locale)} - Quản lý cơ sở
                      </SelectItem>
                      <SelectItem value={UserRole.OPERATOR}>
                        {getRoleDisplayName(UserRole.OPERATOR, locale)} - Nhân viên vận hành
                      </SelectItem>
                      <SelectItem value={UserRole.VIEWER}>
                        {getRoleDisplayName(UserRole.VIEWER, locale)} - Chỉ xem
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationType" className="flex items-center gap-2">
                    Loại tổ chức *
                    <a
                      href="https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-food-traceability"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      (Theo FSMA 204)
                    </a>
                  </Label>
                  <Select value={organizationType} onValueChange={setOrganizationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại tổ chức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farm">
                        <div className="flex flex-col">
                          <span className="font-medium">🌾 Trang trại (Farm)</span>
                          <span className="text-xs text-muted-foreground">CTE: Harvest, Cooling, Shipping</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="packing_house">
                        <div className="flex flex-col">
                          <span className="font-medium">📦 Nhà đóng gói (Packing House)</span>
                          <span className="text-xs text-muted-foreground">
                            CTE: Cooling, Packing, Receiving, Shipping
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="processor">
                        <div className="flex flex-col">
                          <span className="font-medium">🏭 Nhà máy chế biến (Processor)</span>
                          <span className="text-xs text-muted-foreground">
                            CTE: Receiving, Transformation, Shipping
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="distributor">
                        <div className="flex flex-col">
                          <span className="font-medium">🚚 Nhà phân phối (Distributor)</span>
                          <span className="text-xs text-muted-foreground">CTE: Receiving, Shipping</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="retailer">
                        <div className="flex flex-col">
                          <span className="font-medium">🏪 Nhà bán lẻ (Retailer)</span>
                          <span className="text-xs text-muted-foreground">CTE: Receiving only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="importer">
                        <div className="flex flex-col">
                          <span className="font-medium">🛃 Nhà nhập khẩu (Importer)</span>
                          <span className="text-xs text-muted-foreground">
                            CTE: First Receiving, Receiving, Shipping
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="port_operator">
                        <div className="flex flex-col">
                          <span className="font-medium">⚓ Cơ sở cảng biển (Port Operator)</span>
                          <span className="text-xs text-muted-foreground">CTE: First Receiving only</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Loại tổ chức xác định CTE nào user được phép tạo theo quy định FSMA 204
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Công ty</Label>
                  <div className="flex gap-2">
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn công ty (tùy chọn)" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
                          <SelectItem value="none">Không gán công ty (System Admin only)</SelectItem>
                        )}
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{company.name}</span>
                              {company.display_name && company.display_name !== company.name && (
                                <span className="text-xs text-muted-foreground">({company.display_name})</span>
                              )}
                              {company.registration_number && (
                                <span className="text-xs text-muted-foreground">
                                  MST: {company.registration_number}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
                      <Button type="button" variant="outline" onClick={() => setShowCreateCompany(!showCreateCompany)}>
                        {showCreateCompany ? "Hủy" : "+ Công ty mới"}
                      </Button>
                    )}
                  </div>
                  {showCreateCompany && (
                    <Card className="mt-3">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tạo công ty mới</CardTitle>
                        <CardDescription className="text-sm">Nhập đầy đủ thông tin công ty</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="newCompanyName" className="text-sm">
                            Tên công ty *
                          </Label>
                          <Input
                            id="newCompanyName"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="Công ty TNHH ABC"
                            disabled={isCreatingCompany}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCompanyRegistrationNumber" className="text-sm">
                            Mã số thuế
                          </Label>
                          <Input
                            id="newCompanyRegistrationNumber"
                            value={newCompanyRegistrationNumber}
                            onChange={(e) => setNewCompanyRegistrationNumber(e.target.value)}
                            placeholder="0123456789"
                            disabled={isCreatingCompany}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCompanyAddress" className="text-sm">
                            Địa chỉ
                          </Label>
                          <Input
                            id="newCompanyAddress"
                            value={newCompanyAddress}
                            onChange={(e) => setNewCompanyAddress(e.target.value)}
                            placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
                            disabled={isCreatingCompany}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="newCompanyPhone" className="text-sm">
                              Số điện thoại
                            </Label>
                            <Input
                              id="newCompanyPhone"
                              value={newCompanyPhone}
                              onChange={(e) => setNewCompanyPhone(e.target.value)}
                              placeholder="0901234567"
                              disabled={isCreatingCompany}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newCompanyEmail" className="text-sm">
                              Email
                            </Label>
                            <Input
                              id="newCompanyEmail"
                              type="email"
                              value={newCompanyEmail}
                              onChange={(e) => setNewCompanyEmail(e.target.value)}
                              placeholder="contact@company.com"
                              disabled={isCreatingCompany}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCompanyContactPerson" className="text-sm">
                            Người liên hệ
                          </Label>
                          <Input
                            id="newCompanyContactPerson"
                            value={newCompanyContactPerson}
                            onChange={(e) => setNewCompanyContactPerson(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            disabled={isCreatingCompany}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCompany}
                          disabled={isCreatingCompany || !newCompanyName.trim()}
                          className="w-full"
                        >
                          {isCreatingCompany ? "Đang tạo..." : "Tạo công ty"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full ${role === UserRole.SYSTEM_ADMIN ? "bg-purple-600 hover:bg-purple-700" : ""}`}
              >
                {isLoading ? "Đang tạo..." : role === UserRole.SYSTEM_ADMIN ? "🔒 Tạo System Admin" : "Tạo tài khoản"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showSystemAdminConfirm} onOpenChange={setShowSystemAdminConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-900 text-xl">⚠️ Xác nhận tạo System Admin</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-base">
              <p className="font-semibold text-purple-800">
                Bạn đang tạo tài khoản với quyền SYSTEM ADMIN - quyền cao nhất trong hệ thống.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2">
                <p className="font-medium text-purple-900">Thông tin tài khoản:</p>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>
                    • <strong>Email:</strong> {email}
                  </li>
                  <li>
                    • <strong>Họ tên:</strong> {fullName}
                  </li>
                  <li>
                    • <strong>Vai trò:</strong> System Administrator
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-700">System Admin có thể:</p>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                <li>Quản lý tất cả công ty và người dùng</li>
                <li>Xem và chỉnh sửa mọi dữ liệu trong hệ thống</li>
                <li>Tạo và xóa System Admin khác</li>
                <li>Truy cập logs và cấu hình hệ thống</li>
              </ul>
              <p className="font-semibold text-red-600">Bạn có chắc chắn muốn tiếp tục?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSystemAdminConfirm(false)}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSystemAdmin} className="bg-purple-600 hover:bg-purple-700">
              Xác nhận tạo System Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Tổ chức</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadge(profile.role)}>{getRoleDisplayName(profile.role, locale)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getOrganizationBadge(profile.organization_type).className}>
                      {getOrganizationBadge(profile.organization_type).label}
                    </Badge>
                  </TableCell>
                  <TableCell>{profile.phone || "-"}</TableCell>
                  <TableCell>{new Date(profile.created_at).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = `/admin/users/${profile.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Chi tiết
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(profile.id, profile.full_name)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
