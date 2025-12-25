"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Settings, LogOut, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserProfileMenuProps {
  user: SupabaseUser
  profile: any
}

export function UserProfileMenu({ user, profile }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return user.email?.[0]?.toUpperCase() || "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getDisplayName = () => {
    if (profile?.full_name) {
      // Get first name from full name (e.g., "Nguyen Huu Linh" -> "Linh")
      const parts = profile.full_name.trim().split(" ")
      return parts[parts.length - 1] // Return last part (Vietnamese given name)
    }
    return user.email?.split("@")[0] || "User"
  }

  const getRoleBadge = () => {
    if (profile?.role === "system_admin") {
      return (
        <Badge variant="destructive" className="text-xs">
          SYS
        </Badge>
      )
    }
    if (profile?.role === "admin") {
      return <Badge className="text-xs bg-emerald-600">Admin</Badge>
    }
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors group"
      >
        <Avatar className="h-9 w-9 border-2 border-emerald-100">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile?.full_name || user.email} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-semibold">
            {getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-700 hidden sm:block">{getDisplayName()}</span>
          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-lg shadow-xl border border-slate-200">
            <div className="p-4 border-b bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  {profile?.avatar_url && (
                    <AvatarImage
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile?.full_name || user.email}
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">{profile?.full_name || user.email}</p>
                    {getRoleBadge()}
                  </div>
                  <p className="text-xs text-slate-600 truncate">{user.email}</p>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">
                    {profile?.role === "system_admin" ? "System Admin" : profile?.role || "viewer"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <User className="h-4 w-4" />
                  <span>Hồ sơ cá nhân</span>
                </button>
              </Link>
              <Link href="/dashboard/settings" onClick={() => setIsOpen(false)}>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Cài đặt</span>
                </button>
              </Link>
            </div>

            <div className="p-2 border-t">
              <button
                onClick={() => {
                  setIsOpen(false)
                  handleSignOut()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
