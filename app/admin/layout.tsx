import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { LanguageProvider } from "@/contexts/language-context"
import { canAccessAdminPanel } from "@/lib/auth/roles"
import { SubscriptionAlert } from "@/components/subscription-alert"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { ensureProfileExists } = await import("@/lib/supabase/profile-helpers")
  const { profile, error: profileError } = await ensureProfileExists(user)

  console.log("[v0] Admin Layout - User ID:", user.id)
  console.log("[v0] Admin Layout - Profile:", profile)
  console.log("[v0] Admin Layout - Profile Error:", profileError)
  console.log("[v0] Admin Layout - Role:", profile?.role)
  console.log("[v0] Admin Layout - Can Access:", profile ? canAccessAdminPanel(profile.role) : false)

  if (!profile) {
    console.log("[v0] Admin Layout - No profile found and could not create, redirecting to login")
    redirect("/auth/login?error=profile_missing")
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
          <div className="container mx-auto p-6 max-w-7xl">
            {profile.company_id && profile.role === "admin" && <SubscriptionAlert companyId={profile.company_id} />}
            {children}
          </div>
        </main>
      </div>
    </LanguageProvider>
  )
}
