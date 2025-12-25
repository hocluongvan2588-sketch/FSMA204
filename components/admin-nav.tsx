"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Shield,
  LogOut,
  ArrowLeft,
  Package,
  CreditCard,
  UserCog,
  History,
  Receipt,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRoleDisplayName, isSystemAdmin } from "@/lib/auth/roles"

interface AdminNavProps {
  user: User
  profile: any
}

export function AdminNav({ user, profile }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { locale, t } = useLanguage()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const systemAdminNavigation = [
    {
      name: locale === "vi" ? "Tổng quan" : "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      description: locale === "vi" ? "Dashboard quản trị" : "Admin dashboard",
    },
    {
      name: locale === "vi" ? "Người dùng" : "Users",
      href: "/admin/users",
      icon: Users,
      description: locale === "vi" ? "Quản lý tài khoản" : "Account management",
    },
    {
      name: locale === "vi" ? "Công ty" : "Companies",
      href: "/admin/companies",
      icon: Building2,
      description: locale === "vi" ? "Tổ chức" : "Organizations",
    },
    {
      name: locale === "vi" ? "Nhật ký hệ thống" : "System Logs",
      href: "/admin/system-logs",
      icon: FileText,
      description: locale === "vi" ? "Nhật ký kiểm toán" : "Audit trail",
    },
  ]

  const companyAdminNavigation = [
    {
      name: locale === "vi" ? "Tổng quan" : "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      description: locale === "vi" ? "Dashboard quản trị" : "Admin dashboard",
    },
    {
      name: locale === "vi" ? "Người dùng công ty" : "Company Users",
      href: "/admin/users",
      icon: Users,
      description: locale === "vi" ? "Quản lý người dùng" : "User management",
    },
    {
      name: locale === "vi" ? "Công ty của tôi" : "My Company",
      href: "/admin/my-company",
      icon: Building2,
      description: locale === "vi" ? "Thông tin công ty" : "Company information",
    },
  ]

  const navigation = isSystemAdmin(profile?.role) ? systemAdminNavigation : companyAdminNavigation

  const serviceNavigation = isSystemAdmin(profile?.role)
    ? [
        {
          name: locale === "vi" ? "Gói dịch vụ" : "Service Packages",
          href: "/admin/service-packages",
          icon: Package,
          description: locale === "vi" ? "Quản lý gói dịch vụ" : "Package management",
        },
        {
          name: locale === "vi" ? "Đăng ký dịch vụ" : "Subscriptions",
          href: "/admin/subscriptions",
          icon: CreditCard,
          description: locale === "vi" ? "Quản lý đăng ký" : "Subscription management",
        },
      ]
    : []

  const companyServiceNavigation = !isSystemAdmin(profile?.role)
    ? [
        {
          name: locale === "vi" ? "Gói dịch vụ của tôi" : "My Subscription",
          href: "/admin/my-subscription",
          icon: CreditCard,
          description: locale === "vi" ? "Xem và nâng cấp gói" : "View and upgrade plan",
        },
        {
          name: locale === "vi" ? "Lịch sử thanh toán" : "Payment History",
          href: "/admin/payment-history",
          icon: Receipt,
          description: locale === "vi" ? "Giao dịch và hóa đơn" : "Transactions and invoices",
        },
        {
          name: locale === "vi" ? "Xem tất cả gói" : "View All Plans",
          href: "/admin/pricing",
          icon: Package,
          description: locale === "vi" ? "So sánh các gói dịch vụ" : "Compare service plans",
        },
      ]
    : []

  const fdaComplianceNavigation = [
    {
      name: locale === "vi" ? "Quản lý Cơ sở FDA" : "FDA Facility Management",
      href: "/admin/fda-registrations",
      icon: Shield,
      description: locale === "vi" ? "Quản lý đăng ký FDA" : "FDA registration management",
    },
    {
      name: locale === "vi" ? "US Agent" : "US Agent",
      href: "/admin/us-agents",
      icon: UserCog,
      description: locale === "vi" ? "Quản lý đại lý Mỹ" : "US agent management",
    },
  ]

  const auditNavigation = [
    {
      name: locale === "vi" ? "Nhật ký kiểm toán" : "Audit Logs",
      href: "/dashboard/audit",
      icon: History,
      description: locale === "vi" ? "Theo dõi thay đổi dữ liệu" : "Track data changes",
    },
  ]

  return (
    <aside className="w-72 border-r bg-white shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shadow-md",
              isSystemAdmin(profile?.role)
                ? "bg-gradient-to-br from-purple-600 to-pink-600"
                : "bg-gradient-to-br from-red-600 to-orange-600",
            )}
          >
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{locale === "vi" ? "Quản trị" : "Admin Panel"}</h2>
            <p className="text-xs text-slate-500">
              {isSystemAdmin(profile?.role)
                ? locale === "vi"
                  ? "Quản lý hệ thống"
                  : "System Management"
                : locale === "vi"
                  ? "Quản lý công ty"
                  : "Company Management"}
            </p>
          </div>
        </div>
        <Badge
          variant={isSystemAdmin(profile?.role) ? "default" : "destructive"}
          className={cn("w-full justify-center", isSystemAdmin(profile?.role) && "bg-purple-600")}
        >
          {getRoleDisplayName(profile?.role, locale)}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {locale === "vi" ? "QUẢN TRỊ" : "ADMINISTRATION"}
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]",
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-500")} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-slate-500">{item.description}</div>
              </div>
            </Link>
          )
        })}

        {serviceNavigation.length > 0 && (
          <>
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {locale === "vi" ? "QUẢN LÝ DỊCH VỤ" : "SERVICE MANAGEMENT"}
              </p>
            </div>
            {serviceNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </>
        )}

        {companyServiceNavigation.length > 0 && (
          <>
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {locale === "vi" ? "DỊCH VỤ" : "SERVICES"}
              </p>
            </div>
            {companyServiceNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </>
        )}

        <>
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {locale === "vi" ? "TUÂN THỦ FDA" : "FDA COMPLIANCE"}
            </p>
          </div>
          {fdaComplianceNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]",
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-500")} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </>

        <>
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {locale === "vi" ? "KIỂM TOÁN" : "AUDIT"}
            </p>
          </div>
          {auditNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]",
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-500")} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </>

        <div className="pt-6">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {locale === "vi" ? "KHÁC" : "OTHER"}
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
            <span>{locale === "vi" ? "Quay về Dashboard" : "Back to Dashboard"}</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <LanguageSwitcher />

        <div className="rounded-lg bg-slate-50 p-3 border">
          <p className="text-sm font-medium text-slate-900 truncate">
            {profile?.full_name || (locale === "vi" ? "Quản trị viên" : "Administrator")}
          </p>
          <p className="text-xs text-slate-500 truncate">{profile?.email || user.email}</p>
          {isSystemAdmin(profile?.role) ? (
            <Badge className="mt-2 w-full justify-center bg-purple-600 hover:bg-purple-700">
              {locale === "vi" ? "SYSTEM ADMIN - Toàn hệ thống" : "SYSTEM ADMIN - Full Access"}
            </Badge>
          ) : (
            <Badge className="mt-2 w-full justify-center bg-orange-600 hover:bg-orange-700">
              {locale === "vi" ? "ADMIN - Phạm vi công ty" : "ADMIN - Company Scope"}
            </Badge>
          )}
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {locale === "vi" ? "Đăng xuất" : "Sign Out"}
        </Button>
      </div>
    </aside>
  )
}
