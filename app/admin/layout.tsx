import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { LanguageProvider } from "@/contexts/language-context"
import { canAccessAdminPanel } from "@/lib/auth/roles"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[v0] Admin Layout - User ID:", user.id)
  console.log("[v0] Admin Layout - Profile:", profile)
  console.log("[v0] Admin Layout - Profile Error:", profileError)
  console.log("[v0] Admin Layout - Role:", profile?.role)
  console.log("[v0] Admin Layout - Can Access:", profile ? canAccessAdminPanel(profile.role) : false)

  if (!profile) {
    console.log("[v0] Admin Layout - No profile found, redirecting to dashboard")
    redirect("/dashboard")
  }

  if (!canAccessAdminPanel(profile.role)) {
    console.log("[v0] Admin Layout - No admin access, redirecting to dashboard")
    redirect("/dashboard")
  }

  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AdminNav user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">{children}</div>
        </main>
      </div>
    </LanguageProvider>
  )
}
