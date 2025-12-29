"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Building2, Users, Pencil, Trash2 } from "lucide-react"
import { isSystemAdmin } from "@/lib/auth/roles"
import { PlanBadge } from "@/components/plan-badge"
import { useToast } from "@/hooks/use-toast"
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

interface Company {
  id: string
  name: string
  registration_number: string
  email: string
  phone: string
  created_at: string
  _count?: {
    facilities: number
    users: number
  }
}

export default function AdminCompaniesPage() {
  const { locale, t } = useLanguage()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    registration_number: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    loadCurrentUser()
    loadCompanies()
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

  const loadCompanies = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role, company_id")
        .eq("id", user?.id)
        .single()

      let companiesQuery = supabase.from("companies").select("*").order("created_at", { ascending: false })

      if (currentProfile && !isSystemAdmin(currentProfile.role)) {
        companiesQuery = companiesQuery.eq("id", currentProfile.company_id)
      }

      const { data: companiesData } = await companiesQuery

      if (companiesData) {
        const companiesWithCounts = await Promise.all(
          companiesData.map(async (company) => {
            const [facilitiesCount, usersCount] = await Promise.all([
              supabase.from("facilities").select("id", { count: "exact", head: true }).eq("company_id", company.id),
              supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", company.id),
            ])

            return {
              ...company,
              _count: {
                facilities: facilitiesCount.count || 0,
                users: usersCount.count || 0,
              },
            }
          }),
        )

        setCompanies(companiesWithCounts)
      }
    } catch (error) {
      console.error("Error loading companies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setEditForm({
      name: company.name,
      registration_number: company.registration_number || "",
      email: company.email || "",
      phone: company.phone || "",
      address: "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCompany) return

    try {
      const response = await fetch(`/api/admin/companies/${editingCompany.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update company")
      }

      toast({
        title: "✅ Cập nhật thành công",
        description: "Thông tin công ty đã được cập nhật",
      })

      setIsEditDialogOpen(false)
      loadCompanies()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi cập nhật",
        description: error.message,
      })
    }
  }

  const handleDeleteCompany = async (company: Company) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa công ty "${company.name}"?\n\nLưu ý: Công ty phải không có user và facility mới có thể xóa.`,
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete company")
      }

      toast({
        title: "✅ Xóa thành công",
        description: `Đã xóa công ty "${company.name}"`,
      })

      loadCompanies()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Lỗi xóa công ty",
        description: error.message,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t("common.messages.loading")}</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("company.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {currentUserProfile && isSystemAdmin(currentUserProfile.role)
              ? t("admin.systemAdminDesc")
              : t("admin.subtitle")}
          </p>
        </div>
      </div>

      {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
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
            <p className="font-semibold">{t("admin.common.systemAdminModeTitle")}</p>
            <p className="text-sm">{t("admin.systemAdminDesc")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.nav.company")}</CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("company.info.facilities")}</CardTitle>
            <Building2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {companies.reduce((sum, c) => sum + (c._count?.facilities || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.totalUsers")}</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{companies.reduce((sum, c) => sum + (c._count?.users || 0), 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("company.title")}</CardTitle>
          <CardDescription>
            {companies.length} {t("admin.common.foundResults")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t("common.messages.noData")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("company.fields.name")}</TableHead>
                  <TableHead>{t("company.fields.taxId")}</TableHead>
                  <TableHead>{t("company.fields.email")}</TableHead>
                  <TableHead>Gói dịch vụ</TableHead>
                  <TableHead>{t("company.info.facilities")}</TableHead>
                  <TableHead>{t("admin.users.title")}</TableHead>
                  <TableHead>{t("common.fields.createdAt")}</TableHead>
                  {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
                    <TableHead className="text-right">Hành động</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.registration_number}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{company.email}</div>
                        <div className="text-muted-foreground">{company.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlanBadge companyId={company.id} variant="compact" />
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700">{company._count?.facilities || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">{company._count?.users || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                    </TableCell>
                    {currentUserProfile && isSystemAdmin(currentUserProfile.role) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCompany(company)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCompany(company)}
                            disabled={(company._count?.users || 0) > 0 || (company._count?.facilities || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa công ty</DialogTitle>
            <DialogDescription>Cập nhật thông tin công ty</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên công ty *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nhập tên công ty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">Mã số thuế</Label>
              <Input
                id="registration_number"
                value={editForm.registration_number}
                onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                placeholder="Nhập mã số thuế"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Nhập email công ty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
