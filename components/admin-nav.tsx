"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LayoutDashboard, Users, Building2, FileText, Shield, LogOut, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AdminNavProps {
  user: User
  profile: any
}

export function AdminNav({ user, profile }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const navigation = [
    {
      name: language === "vi" ? "Tổng quan" : "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      description: language === "vi" ? "Dashboard quản trị" : "Admin dashboard",
    },
    {
      name: language === "vi" ? "Người dùng" : "Users",
      href: "/admin/users",
      icon: Users,
      description: language === "vi" ? "Quản lý tài khoản" : "Account management",
    },
    {
      name: language === "vi" ? "Công ty" : "Companies",
      href: "/admin/companies",
      icon: Building2,
      description: language === "vi" ? "Tổ chức trong hệ thống" : "Organizations",
    },
    {
      name: language === "vi" ? "Nhật ký hệ thống" : "System Logs",
      href: "/admin/system-logs",
      icon: FileText,
      description: language === "vi" ? "Audit trail" : "Audit trail",
    },
  ]

  return (
    <aside className="w-72 border-r bg-white shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-md">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Admin Panel</h2>
            <p className="text-xs text-slate-500">System Management</p>
          </div>
        </div>
        <Badge variant="destructive" className="w-full justify-center">
          Administrator
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {language === "vi" ? "Quản trị" : "Administration"}
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

        <div className="pt-6">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {language === "vi" ? "Khác" : "Other"}
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
            <span>{language === "vi" ? "Về Dashboard" : "Back to Dashboard"}</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <LanguageSwitcher />

        <div className="rounded-lg bg-slate-50 p-3 border">
          <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || "Administrator"}</p>
          <p className="text-xs text-slate-500 truncate">{profile?.email || user.email}</p>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {language === "vi" ? "Đăng xuất" : "Sign Out"}
        </Button>
      </div>
    </aside>
  )
}
