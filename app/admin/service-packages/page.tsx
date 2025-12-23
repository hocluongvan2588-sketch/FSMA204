"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Package, Plus, Edit, Trash2, Star } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface ServicePackage {
  id: string
  package_code: string
  package_name: string
  package_name_vi: string
  description: string
  description_vi: string
  price_monthly: number
  price_yearly: number
  price_currency: string
  max_users: number
  max_facilities: number
  max_products: number
  max_storage_gb: number
  includes_fda_management: boolean
  includes_agent_management: boolean
  includes_cte_tracking: boolean
  includes_reporting: boolean
  includes_api_access: boolean
  includes_custom_branding: boolean
  includes_priority_support: boolean
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function AdminServicePackagesPage() {
  const { locale, t } = useLanguage()
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    package_code: "",
    package_name: "",
    package_name_vi: "",
    description: "",
    description_vi: "",
    price_monthly: 0,
    price_yearly: 0,
    price_currency: "USD",
    max_users: 5,
    max_facilities: 1,
    max_products: 10,
    max_storage_gb: 1,
    includes_fda_management: false,
    includes_agent_management: false,
    includes_cte_tracking: false,
    includes_reporting: false,
    includes_api_access: false,
    includes_custom_branding: false,
    includes_priority_support: false,
    is_active: true,
    is_featured: false,
    sort_order: 0,
  })

  useEffect(() => {
    loadCurrentUser()
    loadPackages()
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

  const loadPackages = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("service_packages")
        .select("*")
        .order("sort_order", { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error("Error loading packages:", error)
      toast({
        variant: "destructive",
        title: t("error_loading_data"),
        description: error instanceof Error ? error.message : t("unknown_error"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePackage = async () => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("service_packages").insert([formData])

      if (error) throw error

      toast({
        title: t("package_created_successfully"),
        description: t("package_created", { name: formData.package_name }),
      })

      setShowCreateDialog(false)
      resetForm()
      loadPackages()
    } catch (error) {
      console.error("Error creating package:", error)
      toast({
        variant: "destructive",
        title: t("error_creating_package"),
        description: error instanceof Error ? error.message : t("unknown_error"),
      })
    }
  }

  const handleUpdatePackage = async () => {
    if (!editingPackage) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("service_packages").update(formData).eq("id", editingPackage.id)

      if (error) throw error

      toast({
        title: t("updated_successfully"),
        description: t("package_updated", { name: formData.package_name }),
      })

      setEditingPackage(null)
      resetForm()
      loadPackages()
    } catch (error) {
      console.error("Error updating package:", error)
      toast({
        variant: "destructive",
        title: t("error_updating"),
        description: error instanceof Error ? error.message : t("unknown_error"),
      })
    }
  }

  const handleDeletePackage = async (pkg: ServicePackage) => {
    if (!confirm(t("confirm_delete_package", { name: pkg.package_name }))) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("service_packages").delete().eq("id", pkg.id)

      if (error) throw error

      toast({
        title: t("deleted_successfully"),
        description: t("package_deleted", { name: pkg.package_name }),
      })

      loadPackages()
    } catch (error) {
      console.error("Error deleting package:", error)
      toast({
        variant: "destructive",
        title: t("error_deleting_package"),
        description: error instanceof Error ? error.message : t("unknown_error"),
      })
    }
  }

  const openEditDialog = (pkg: ServicePackage) => {
    setEditingPackage(pkg)
    setFormData({
      package_code: pkg.package_code,
      package_name: pkg.package_name,
      package_name_vi: pkg.package_name_vi,
      description: pkg.description,
      description_vi: pkg.description_vi,
      price_monthly: pkg.price_monthly,
      price_yearly: pkg.price_yearly,
      price_currency: pkg.price_currency,
      max_users: pkg.max_users,
      max_facilities: pkg.max_facilities,
      max_products: pkg.max_products,
      max_storage_gb: pkg.max_storage_gb,
      includes_fda_management: pkg.includes_fda_management,
      includes_agent_management: pkg.includes_agent_management,
      includes_cte_tracking: pkg.includes_cte_tracking,
      includes_reporting: pkg.includes_reporting,
      includes_api_access: pkg.includes_api_access,
      includes_custom_branding: pkg.includes_custom_branding,
      includes_priority_support: pkg.includes_priority_support,
      is_active: pkg.is_active,
      is_featured: pkg.is_featured,
      sort_order: pkg.sort_order,
    })
  }

  const resetForm = () => {
    setFormData({
      package_code: "",
      package_name: "",
      package_name_vi: "",
      description: "",
      description_vi: "",
      price_monthly: 0,
      price_yearly: 0,
      price_currency: "USD",
      max_users: 5,
      max_facilities: 1,
      max_products: 10,
      max_storage_gb: 1,
      includes_fda_management: false,
      includes_agent_management: false,
      includes_cte_tracking: false,
      includes_reporting: false,
      includes_api_access: false,
      includes_custom_branding: false,
      includes_priority_support: false,
      is_active: true,
      is_featured: false,
      sort_order: 0,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t("loading")}</div>
      </div>
    )
  }

  if (!currentUserProfile || !isSystemAdmin(currentUserProfile.role)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">{t("no_access")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("service_packages")}</h1>
          <p className="text-muted-foreground mt-1">{t("create_and_manage_service_packages")}</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("create_package")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_packages")}</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("active")}</CardTitle>
            <Package className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{packages.filter((p) => p.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("featured")}</CardTitle>
            <Star className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{packages.filter((p) => p.is_featured).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("inactive")}</CardTitle>
            <Package className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{packages.filter((p) => !p.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("package_list")}</CardTitle>
          <CardDescription>{t("packages_in_system", { count: packages.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t("no_packages_yet")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("price")}</TableHead>
                  <TableHead>{t("limits")}</TableHead>
                  <TableHead>{t("features")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <Badge variant="outline">{pkg.package_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {locale === "vi" ? pkg.package_name_vi : pkg.package_name}
                          {pkg.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {locale === "vi" ? pkg.description_vi : pkg.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          ${pkg.price_monthly}/{t("month")}
                        </div>
                        <div className="text-muted-foreground">
                          ${pkg.price_yearly}/{t("year")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>
                          {pkg.max_users} {t("users")}
                        </div>
                        <div>
                          {pkg.max_facilities} {t("facilities")}
                        </div>
                        <div>
                          {pkg.max_products} {t("products")}
                        </div>
                        <div>
                          {pkg.max_storage_gb} GB {t("storage")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pkg.includes_fda_management && (
                          <Badge variant="secondary" className="text-xs">
                            FDA
                          </Badge>
                        )}
                        {pkg.includes_agent_management && (
                          <Badge variant="secondary" className="text-xs">
                            {t("us_agent")}
                          </Badge>
                        )}
                        {pkg.includes_cte_tracking && (
                          <Badge variant="secondary" className="text-xs">
                            CTE
                          </Badge>
                        )}
                        {pkg.includes_reporting && (
                          <Badge variant="secondary" className="text-xs">
                            {t("reports")}
                          </Badge>
                        )}
                        {pkg.includes_api_access && (
                          <Badge variant="secondary" className="text-xs">
                            API
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={pkg.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {pkg.is_active ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(pkg)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingPackage}
        onOpenChange={(open) => !open && (setShowCreateDialog(false), setEditingPackage(null), resetForm())}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? t("edit_package") : t("create_new_package")}</DialogTitle>
            <DialogDescription>{t("fill_package_details")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_code">{t("package_code")} *</Label>
                <Input
                  id="package_code"
                  value={formData.package_code}
                  onChange={(e) => setFormData({ ...formData, package_code: e.target.value })}
                  placeholder="BASIC, PRO, ENTERPRISE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">{t("sort_order")}</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_name">{t("package_name_english")} *</Label>
                <Input
                  id="package_name"
                  value={formData.package_name}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package_name_vi">{t("package_name_vietnamese")} *</Label>
                <Input
                  id="package_name_vi"
                  value={formData.package_name_vi}
                  onChange={(e) => setFormData({ ...formData, package_name_vi: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">{t("description_english")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_vi">{t("description_vietnamese")}</Label>
                <Textarea
                  id="description_vi"
                  value={formData.description_vi}
                  onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{t("pricing")}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly">{t("monthly_price_usd")}</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_yearly">{t("yearly_price_usd")}</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_currency">{t("currency")}</Label>
                  <Input
                    id="price_currency"
                    value={formData.price_currency}
                    onChange={(e) => setFormData({ ...formData, price_currency: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{t("limits")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_users">{t("max_users")}</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_facilities">{t("max_facilities")}</Label>
                  <Input
                    id="max_facilities"
                    type="number"
                    value={formData.max_facilities}
                    onChange={(e) => setFormData({ ...formData, max_facilities: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_products">{t("max_products")}</Label>
                  <Input
                    id="max_products"
                    type="number"
                    value={formData.max_products}
                    onChange={(e) => setFormData({ ...formData, max_products: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_storage_gb">{t("storage_gb")}</Label>
                  <Input
                    id="max_storage_gb"
                    type="number"
                    value={formData.max_storage_gb}
                    onChange={(e) => setFormData({ ...formData, max_storage_gb: Number.parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{t("features")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fda">{t("fda_management")}</Label>
                  <Switch
                    id="fda"
                    checked={formData.includes_fda_management}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_fda_management: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent">{t("agent_management")}</Label>
                  <Switch
                    id="agent"
                    checked={formData.includes_agent_management}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_agent_management: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cte">{t("cte_tracking")}</Label>
                  <Switch
                    id="cte"
                    checked={formData.includes_cte_tracking}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_cte_tracking: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reporting">{t("reporting")}</Label>
                  <Switch
                    id="reporting"
                    checked={formData.includes_reporting}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_reporting: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="api">{t("api_access")}</Label>
                  <Switch
                    id="api"
                    checked={formData.includes_api_access}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_api_access: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="branding">{t("custom_branding")}</Label>
                  <Switch
                    id="branding"
                    checked={formData.includes_custom_branding}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_custom_branding: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="support">{t("priority_support")}</Label>
                  <Switch
                    id="support"
                    checked={formData.includes_priority_support}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_priority_support: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t("active")}</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">{t("featured")}</Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingPackage(null)
                resetForm()
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={editingPackage ? handleUpdatePackage : handleCreatePackage}>
              {editingPackage ? t("update") : t("create_package")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
