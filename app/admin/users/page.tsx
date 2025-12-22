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

interface Profile {
  id: string
  full_name: string
  role: string
  email?: string
  phone: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
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
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load all profiles
    const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

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
      const supabase = createClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError) throw authError

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        company_id: companyId || null,
        full_name: fullName,
        role,
        phone: phone || null,
      })

      if (profileError) throw profileError

      setSuccess("Tạo tài khoản thành công! Email xác nhận đã được gửi.")

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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
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
          <p className="text-muted-foreground mt-1">Tạo và quản lý tài khoản người dùng trong hệ thống</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Hủy" : "+ Tạo người dùng mới"}
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>}

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
                      <SelectItem value="admin">Admin - Quản trị hệ thống</SelectItem>
                      <SelectItem value="manager">Manager - Quản lý</SelectItem>
                      <SelectItem value="operator">Operator - Nhân viên vận hành</SelectItem>
                      <SelectItem value="viewer">Viewer - Chỉ xem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Công ty</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn công ty (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không gán công ty</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Badge className={getRoleBadge(profile.role)}>{profile.role.toUpperCase()}</Badge>
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
