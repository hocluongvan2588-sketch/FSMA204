import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { LanguageProviderWrapper } from "@/components/language-provider-wrapper"
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

  if (!profile) {
    redirect("/auth/login?error=profile_missing")
  }

  if (!canAccessAdminPanel(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <LanguageProviderWrapper>
      <div className="flex min-h-screen bg-slate-50">
        <AdminNav user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {profile.company_id && profile.role === "admin" && <SubscriptionAlert companyId={profile.company_id} />}
            {children}
          </div>
        </main>
      </div>
    </LanguageProviderWrapper>
  )
}
