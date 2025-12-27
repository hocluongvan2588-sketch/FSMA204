"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { isMenuItemVisibleForOrgType } from "@/lib/utils/cte-permissions"
import {
  Home,
  Bell,
  Search,
  Building2,
  Package,
  Tag,
  FileText,
  Truck,
  BarChart3,
  Users2,
  Settings,
  Factory,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
} from "lucide-react"

interface DashboardNavProps {
  user: User
  profile: any
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const isAdminUser = profile?.role === "admin" || profile?.role === "system_admin"
  const orgType = profile?.organization_type

  const canAccessLots = (orgType: string | null) => {
    // All organizations can create/manage TLCs
    return true
  }

  const canAccessShipments = (orgType: string | null) => {
    if (!orgType) return true
    // Retailers don't ship products, they only receive
    return orgType !== "retailer"
  }

  const canAccessCTE = (orgType: string | null) => {
    // All organizations need to create CTEs
    return true
  }

  const canAccessReconciliation = (orgType: string | null) => {
    if (!orgType) return true
    // Farms and port operators typically don't need reconciliation
    return orgType !== "farm" && orgType !== "port"
  }

  const overviewNav = [{ name: "Tổng quan", href: "/dashboard", icon: Home, dataTour: undefined }]

  const setupNav = [
    { name: "Sản phẩm", href: "/dashboard/products", icon: Package, dataTour: "products" },
    { name: "Kho tại chỗ", href: "/dashboard/facilities", icon: Factory, dataTour: "facilities" },
    { name: "Đội ngũ Operator", href: "/dashboard/operator", icon: Users2, dataTour: undefined },
  ]

  const productionNav = [
    ...(canAccessLots(orgType) && isMenuItemVisibleForOrgType(orgType, "lots")
      ? [{ name: "Mã TLC", href: "/dashboard/lots", icon: Tag, dataTour: "tlc-codes" }]
      : []),
    ...(canAccessCTE(orgType) && isMenuItemVisibleForOrgType(orgType, "cte")
      ? [{ name: "Sự kiện CTE", href: "/dashboard/cte", icon: FileText, dataTour: "cte-events" }]
      : []),
    ...(canAccessShipments(orgType) && isMenuItemVisibleForOrgType(orgType, "shipments")
      ? [{ name: "Lô hàng", href: "/dashboard/shipments", icon: Truck, dataTour: "shipments" }]
      : []),
    ...(isMenuItemVisibleForOrgType(orgType, "traceability")
      ? [{ name: "Truy xuất nguồn gốc", href: "/dashboard/traceability", icon: Search, dataTour: "traceability" }]
      : []),
  ]

  const complianceNav = [
    ...(isMenuItemVisibleForOrgType(orgType, "reports")
      ? [{ name: "Báo cáo FSMA 204", href: "/dashboard/reports", icon: BarChart3, dataTour: "reports" }]
      : []),
    ...(canAccessReconciliation(orgType) && isMenuItemVisibleForOrgType(orgType, "reconciliation")
      ? [{ name: "Đối soát hàng loạt", href: "/dashboard/reconciliation", icon: FileCheck, dataTour: "reconciliation" }]
      : []),
    ...(isMenuItemVisibleForOrgType(orgType, "alerts")
      ? [{ name: "Cảnh báo", href: "/dashboard/alerts", icon: AlertTriangle, dataTour: "alerts" }]
      : []),
  ]

  const adminNotificationNav = [
    { name: "Thông báo", href: "/dashboard/notifications", icon: Bell, dataTour: "notifications" },
    { name: "Công ty", href: "/dashboard/company", icon: Building2, dataTour: "company-info" },
    { name: "Cài đặt thiết bị", href: "/dashboard/settings", icon: Settings, dataTour: undefined },
  ]

  const systemAdminNav = [{ name: "Quản trị viên", href: "/admin", icon: ShieldCheck }]

  const getOrgTypeBadge = (orgType: string | null) => {
    const orgTypeMap: Record<string, { label: string; color: string }> = {
      farm: { label: "Farm", color: "bg-green-100 text-green-700 border-green-300" },
      packing_house: { label: "Packer", color: "bg-blue-100 text-blue-700 border-blue-300" },
      processor: { label: "Processor", color: "bg-purple-100 text-purple-700 border-purple-300" },
      distributor: { label: "Distributor", color: "bg-orange-100 text-orange-700 border-orange-300" },
      retailer: { label: "Retailer", color: "bg-pink-100 text-pink-700 border-pink-300" },
      importer: { label: "Importer", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
      port: { label: "Port", color: "bg-slate-100 text-slate-700 border-slate-300" },
    }
    return orgType ? orgTypeMap[orgType] : null
  }

  const orgBadge = getOrgTypeBadge(orgType)

  const renderNavSection = (title: string, items: typeof productionNav) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.dataTour}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                  : "text-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950",
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <aside
      className={cn(
        "border-r bg-card transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex h-16 items-center border-b px-4 justify-between">
        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              FoodTrace
            </span>
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {renderNavSection("", overviewNav)}
        {renderNavSection("THIẾT LẬP HỆ THỐNG", setupNav)}
        {renderNavSection("SẢN XUẤT & TRUY XUẤT", productionNav)}
        {renderNavSection("BÁO CÁO & TUÂN THỦ", complianceNav)}

        {!collapsed && <div className="my-4 border-t" />}
        {renderNavSection("QUẢN TRỊ & THÔNG BÁO", adminNotificationNav)}

        {isAdminUser && (
          <>
            {!collapsed && <div className="my-4 border-t" />}
            {renderNavSection("HỆ THỐNG", systemAdminNav)}
          </>
        )}
      </nav>

      <div className="border-t p-4">
        {!collapsed && (
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
        )}
        <Link href="/dashboard/profile" className="block mb-3">
          <div
            className={cn(
              "rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-3 hover:shadow-md transition-all",
              collapsed && "flex items-center justify-center",
            )}
          >
            {!collapsed ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || user.email}</p>
                  {profile?.role === "system_admin" && (
                    <Badge variant="destructive" className="text-xs">
                      SYS
                    </Badge>
                  )}
                  {profile?.role === "admin" && (
                    <Badge variant="default" className="text-xs bg-emerald-600">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize mb-2">
                  {profile?.role === "system_admin" ? "System Admin" : profile?.role || "viewer"}
                </p>
                {orgBadge && (
                  <Badge variant="outline" className={`text-xs ${orgBadge.color} border`}>
                    {orgBadge.label}
                  </Badge>
                )}
              </>
            ) : (
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <Button variant="outline" className={cn("w-full rounded-xl", collapsed && "px-0")} onClick={handleSignOut}>
          {collapsed ? "↗" : t("dashboard.nav.signOut")}
        </Button>
      </div>
    </aside>
  )
}
