import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { LanguageProvider } from "@/contexts/language-context"
import { SubscriptionAlert } from "@/components/subscription-alert"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login?error=session_expired")
  }

  const { ensureProfileExists } = await import("@/lib/supabase/profile-helpers")
  const { profile, error: profileError } = await ensureProfileExists(user)

  if (!profile) {
    if (profileError && profileError.code === "42P17") {
      console.error("[v0] RLS infinite recursion detected. Please run the fix script.")
      redirect("/auth/login?error=database_config_error")
    }

    console.error("[v0] Could not load or create profile for user:", user.email)
    await supabase.auth.signOut()
    redirect("/auth/login?error=profile_creation_failed")
  }

  if (profile?.role === "system_admin") {
    redirect("/admin")
  }

  return (
    <LanguageProvider>
      <div className="flex min-h-screen">
        <DashboardNav user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="container mx-auto p-6">
            {profile.company_id && <SubscriptionAlert companyId={profile.company_id} />}
            {children}
          </div>
        </main>
      </div>
    </LanguageProvider>
  )
}
