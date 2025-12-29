"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useLanguage } from "@/contexts/language-context"

interface ServicePackage {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: {
    api_access?: boolean
    priority_support?: boolean
    custom_branding?: boolean
    advanced_reporting?: boolean
    sso?: boolean
  }
  limits: {
    max_users?: number
    max_facilities?: number
    max_products?: number
    max_storage_gb?: number
  }
  is_active: boolean
  display_order: number
  created_at: string
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
    name: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    features: {
      api_access: false,
      priority_support: false,
      custom_branding: false,
      advanced_reporting: false,
      sso: false,
    },
    limits: {
      max_users: 5,
      max_facilities: 1,
      max_products: 10,
      max_storage_gb: 1,
    },
    is_active: true,
    display_order: 0,
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
      console.log("[v0] Fetching service packages...")

      const { data, error } = await supabase
        .from("service_packages")
        .select("*")
        .order("display_order", { ascending: true })

      console.log("[v0] Packages fetch result:", { data, error, count: data?.length })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error("[v0] Error loading packages:", error)
      toast({
        variant: "destructive",
        title: "Error loading packages",
        description: error instanceof Error ? error.message : "Unknown error",
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
        description: t("package_created", { name: formData.name }),
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
        description: t("package_updated", { name: formData.name }),
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
    if (!confirm(t("confirm_delete_package", { name: pkg.name }))) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("service_packages").delete().eq("id", pkg.id)

      if (error) throw error

      toast({
        title: t("deleted_successfully"),
        description: t("package_deleted", { name: pkg.name }),
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
      name: pkg.name,
      description: pkg.description,
      price_monthly: pkg.price_monthly,
      price_yearly: pkg.price_yearly,
      features: {
        api_access: pkg.features.api_access || false,
        priority_support: pkg.features.priority_support || false,
        custom_branding: pkg.features.custom_branding || false,
        advanced_reporting: pkg.features.advanced_reporting || false,
        sso: pkg.features.sso || false,
      },
      limits: {
        max_users: pkg.limits.max_users || 5,
        max_facilities: pkg.limits.max_facilities || 1,
        max_products: pkg.limits.max_products || 10,
        max_storage_gb: pkg.limits.max_storage_gb || 1,
      },
      is_active: pkg.is_active,
      display_order: pkg.display_order,
    })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      features: {
        api_access: false,
        priority_support: false,
        custom_branding: false,
        advanced_reporting: false,
        sso: false,
      },
      limits: {
        max_users: 5,
        max_facilities: 1,
        max_products: 10,
        max_storage_gb: 1,
      },
      is_active: true,
      display_order: 0,
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
            <div className="text-3xl font-bold">{packages.filter((p) => p.features.custom_branding).length}</div>
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
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
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
                      <div className="font-medium flex items-center gap-2">
                        {pkg.name}
                        {pkg.features.custom_branding && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground line-clamp-1">{pkg.description}</div>
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
                          {pkg.limits.max_users} {t("users")}
                        </div>
                        <div>
                          {pkg.limits.max_facilities} {t("facilities")}
                        </div>
                        <div>
                          {pkg.limits.max_products} {t("products")}
                        </div>
                        <div>
                          {pkg.limits.max_storage_gb} GB {t("storage")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pkg.features.api_access && (
                          <Badge variant="secondary" className="text-xs">
                            API
                          </Badge>
                        )}
                        {pkg.features.priority_support && (
                          <Badge variant="secondary" className="text-xs">
                            {t("priority_support")}
                          </Badge>
                        )}
                        {pkg.features.custom_branding && (
                          <Badge variant="secondary" className="text-xs">
                            {t("custom_branding")}
                          </Badge>
                        )}
                        {pkg.features.advanced_reporting && (
                          <Badge variant="secondary" className="text-xs">
                            {t("advanced_reporting")}
                          </Badge>
                        )}
                        {pkg.features.sso && (
                          <Badge variant="secondary" className="text-xs">
                            SSO
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
                <Label htmlFor="name">{t("package_name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">{t("sort_order")}</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
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
                    value={formData.limits.max_users}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: { ...formData.limits, max_users: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_facilities">{t("max_facilities")}</Label>
                  <Input
                    id="max_facilities"
                    type="number"
                    value={formData.limits.max_facilities}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: { ...formData.limits, max_facilities: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_products">{t("max_products")}</Label>
                  <Input
                    id="max_products"
                    type="number"
                    value={formData.limits.max_products}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: { ...formData.limits, max_products: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_storage_gb">{t("storage_gb")}</Label>
                  <Input
                    id="max_storage_gb"
                    type="number"
                    value={formData.limits.max_storage_gb}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: { ...formData.limits, max_storage_gb: Number.parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{t("features")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api_access">{t("api_access")}</Label>
                  <Switch
                    id="api_access"
                    checked={formData.features.api_access}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, api_access: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority_support">{t("priority_support")}</Label>
                  <Switch
                    id="priority_support"
                    checked={formData.features.priority_support}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, priority_support: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom_branding">{t("custom_branding")}</Label>
                  <Switch
                    id="custom_branding"
                    checked={formData.features.custom_branding}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, custom_branding: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="advanced_reporting">{t("advanced_reporting")}</Label>
                  <Switch
                    id="advanced_reporting"
                    checked={formData.features.advanced_reporting}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, advanced_reporting: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sso">{t("sso")}</Label>
                  <Switch
                    id="sso"
                    checked={formData.features.sso}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, sso: checked } })
                    }
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
