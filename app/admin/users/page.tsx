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
import { createUser, createCompany } from "@/app/actions/admin-users"

interface Profile {
  id: string
  full_name: string
  role: string
  email?: string
  phone: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const { t, language } = useLanguage()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState("")
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)
  const [showEnvWarning, setShowEnvWarning] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("viewer")
  const [companyId, setCompanyId] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user?.id)
      .single()

    let profilesQuery = supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (currentProfile && !isSystemAdmin(currentProfile.role)) {
      // Regular admin only sees users from their company
      profilesQuery = profilesQuery.eq("company_id", currentProfile.company_id)
    }

    const { data: profilesData } = await profilesQuery

    if (profilesData) setProfiles(profilesData)

    // Load companies
    const { data: companiesData } = await supabase.from("companies").select("id, name").order("name")

    if (companiesData) setCompanies(companiesData)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
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
      })

      if (result.error) {
        if (result.error.includes("Service role key") || result.error.includes("SUPABASE_SERVICE_ROLE_KEY")) {
          setShowEnvWarning(true)
        }
        setError(result.error)
        return
      }

      setSuccess("Tạo tài khoản thành công!")

      // Reset form
      setEmail("")
      setPassword("")
      setFullName("")
      setRole("viewer")
      setCompanyId("")
      setPhone("")
      setShowCreateForm(false)

      // Reload data
      loadData()
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo tài khoản")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      setError("Vui lòng nhập tên công ty")
      return
    }

    setIsCreatingCompany(true)
    setError(null)

    try {
      const result = await createCompany(newCompanyName)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(`Công ty "${newCompanyName}" đã được tạo thành công!`)
      setNewCompanyName("")
      setShowCreateCompany(false)

      // Reload companies
      loadData()

      // Auto-select the new company
      if (result.company) {
        setCompanyId(result.company.id)
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo công ty")
    } finally {
      setIsCreatingCompany(false)
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
                  <Label htmlFor="role">Vai trò *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
                        <SelectItem value={UserRole.SYSTEM_ADMIN}>
                          {getRoleDisplayName(UserRole.SYSTEM_ADMIN, language)} - Toàn quyền hệ thống
                        </SelectItem>
                      )}
                      <SelectItem value={UserRole.ADMIN}>
                        {getRoleDisplayName(UserRole.ADMIN, language)} - Quản trị công ty
                      </SelectItem>
                      <SelectItem value={UserRole.MANAGER}>
                        {getRoleDisplayName(UserRole.MANAGER, language)} - Quản lý cơ sở
                      </SelectItem>
                      <SelectItem value={UserRole.OPERATOR}>
                        {getRoleDisplayName(UserRole.OPERATOR, language)} - Nhân viên vận hành
                      </SelectItem>
                      <SelectItem value={UserRole.VIEWER}>
                        {getRoleDisplayName(UserRole.VIEWER, language)} - Chỉ xem
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                            {company.name}
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
                    <div className="mt-2 p-3 border rounded-lg bg-muted/50 space-y-2">
                      <Label htmlFor="newCompanyName" className="text-sm">
                        Tên công ty mới
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="newCompanyName"
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="Nhập tên công ty"
                          disabled={isCreatingCompany}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCompany}
                          disabled={isCreatingCompany || !newCompanyName.trim()}
                        >
                          {isCreatingCompany ? "Đang tạo..." : "Tạo"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadge(profile.role)}>{getRoleDisplayName(profile.role, language)}</Badge>
                  </TableCell>
                  <TableCell>{profile.phone || "-"}</TableCell>
                  <TableCell>{new Date(profile.created_at).toLocaleDateString("vi-VN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
