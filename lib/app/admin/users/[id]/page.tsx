"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, KeyRound, User, Mail, Phone, Building, Factory, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface UserProfile {
  id: string
  full_name: string
  role: string
  phone: string | null
  company_id: string | null
  language_preference: string
  organization_type: string | null
  created_at: string
  updated_at: string
}

interface UserAuth {
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authData, setAuthData] = useState<UserAuth | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Form states
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [languagePreference, setLanguagePreference] = useState("vi")
  const [organizationType, setOrganizationType] = useState("")

  useEffect(() => {
    loadUserData()
    loadCompanies()
  }, [id])

  const loadUserData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${id}`)

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Lỗi tải thông tin",
          description: errorData.error || "Không thể tải thông tin người dùng",
        })
        setIsLoading(false)
        return
      }

      const data = await response.json()

      setProfile(data.profile)
      setFullName(data.profile.full_name)
      setRole(data.profile.role)
      setPhone(data.profile.phone || "")
      setCompanyId(data.profile.company_id || "")
      setLanguagePreference(data.profile.language_preference || "vi")
      setOrganizationType(data.profile.organization_type || "")

      setAuthData({
        email: data.auth.email,
        created_at: data.profile.created_at,
        last_sign_in_at: data.auth.last_sign_in_at,
      })

      setIsLoading(false)
    } catch (error: any) {
      console.error("[v0] Error loading user data:", error)
      toast({
        variant: "destructive",
        title: "Lỗi tải thông tin",
        description: error.message || "Không thể tải thông tin người dùng",
      })
      setIsLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("[v0] Error loading companies:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập họ tên",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          role: role,
          phone: phone || null,
          company_id: companyId || null,
          language_preference: languagePreference,
          organization_type: organizationType || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Không thể cập nhật")
      }

      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin người dùng đã được cập nhật",
      })

      setIsSaving(false)
      loadUserData()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: error.message,
      })
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: "Mật khẩu xác nhận không khớp",
      })
      return
    }

    setIsChangingPassword(true)

    // Call admin API to change password
    try {
      const response = await fetch("/api/admin/change-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể đổi mật khẩu")
      }

      toast({
        title: "✅ Đổi mật khẩu thành công!",
        description: "Mật khẩu mới đã được cập nhật",
      })

      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi đổi mật khẩu",
        description: error.message,
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; className: string }> = {
      system_admin: { label: "System Admin", className: "bg-purple-100 text-purple-700 border-purple-300" },
      admin: { label: "Admin", className: "bg-red-100 text-red-700" },
      manager: { label: "Manager", className: "bg-blue-100 text-blue-700" },
      operator: { label: "Operator", className: "bg-green-100 text-green-700" },
      viewer: { label: "Viewer", className: "bg-gray-100 text-gray-700" },
    }
    return config[role] || config.viewer
  }

  const organizationTypes = [
    { value: "farm", label: "Farm - Trang trại", ctes: "Harvest, Cooling, Shipping" },
    { value: "packing_house", label: "Packing House - Cơ sở đóng gói", ctes: "Cooling, Packing, Shipping" },
    { value: "processor", label: "Processor - Cơ sở chế biến", ctes: "Receiving, Transformation, Shipping" },
    { value: "distributor", label: "Distributor - Nhà phân phối", ctes: "Receiving, Shipping" },
    { value: "retailer", label: "Retailer - Nhà bán lẻ", ctes: "Receiving" },
    { value: "importer", label: "Importer - Nhà nhập khẩu", ctes: "First Receiving, Receiving" },
    { value: "port", label: "Port Operator - Cảng biển", ctes: "First Receiving" },
  ]

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

  if (!profile) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Không tìm thấy người dùng</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Chi tiết người dùng</h1>
          <p className="text-muted-foreground">Quản lý thông tin và quyền hạn</p>
        </div>
        <Badge className={getRoleBadge(role).className}>{getRoleBadge(role).label}</Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="h-4 w-4 mr-2" />
            Bảo mật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>Cập nhật thông tin cơ bản của người dùng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input id="email" value={authData?.email || ""} disabled />
                  </div>
                  <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Chỉ xem</SelectItem>
                      <SelectItem value="operator">Operator - Vận hành</SelectItem>
                      <SelectItem value="manager">Manager - Quản lý</SelectItem>
                      <SelectItem value="admin">Admin - Quản trị</SelectItem>
                      <SelectItem value="system_admin">System Admin - Quản trị hệ thống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Công ty</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn công ty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có công ty</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ</Label>
                  <Select value={languagePreference} onValueChange={setLanguagePreference}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="organizationType">Loại tổ chức (FSMA 204)</Label>
                    <a
                      href="https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Quy định FDA <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <Select value={organizationType} onValueChange={setOrganizationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại tổ chức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Chưa xác định</SelectItem>
                        {organizationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span>{type.label}</span>
                              <span className="text-xs text-muted-foreground">CTE: {type.ctes}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Xác định loại CTE mà user được phép tạo theo FSMA 204</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ngày tạo tài khoản</p>
                <p className="font-medium">{new Date(profile.created_at).toLocaleString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cập nhật lần cuối</p>
                <p className="font-medium">{new Date(profile.updated_at).toLocaleString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Đăng nhập lần cuối</p>
                <p className="font-medium">
                  {authData?.last_sign_in_at
                    ? new Date(authData.last_sign_in_at).toLocaleString("vi-VN")
                    : "Chưa đăng nhập"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{profile.id}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu mới cho người dùng này</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Lưu ý:</strong> Người dùng sẽ cần sử dụng mật khẩu mới này để đăng nhập vào lần tiếp theo.
                    Hãy đảm bảo thông báo cho họ về việc thay đổi này.
                  </p>
                </div>

                <Button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full">
                  <KeyRound className="h-4 w-4 mr-2" />
                  {isChangingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
