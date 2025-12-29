import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { LanguageProvider } from "@/contexts/language-context"
import { SubscriptionAlert } from "@/components/subscription-alert"
import { NotificationBell } from "@/components/notification-bell"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { GlobalSearch } from "@/components/global-search"
import { Suspense } from "react"
import { PlanBadge } from "@/components/plan-badge" // Import PlanBadge component

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
    console.error("[v0] Could not load or create profile for user:", user.email)
    console.error("[v0] Error:", profileError)
    await supabase.auth.signOut()
    redirect("/auth/login?error=profile_creation_failed")
  }

  if (profile.role === "system_admin") {
    redirect("/admin") // Redirect system_admin to /admin instead of /system-admin
  }

  return (
    <LanguageProvider>
      <div className="flex min-h-screen">
        <DashboardNav user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="border-b bg-white sticky top-0 z-30">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
              <Suspense fallback={<div>Loading...</div>}>
                <GlobalSearch />
                <div className="flex items-center gap-3">
                  {profile?.company_id && (
                    <div className="hidden sm:block">
                      <PlanBadge companyId={profile.company_id} variant="compact" />
                    </div>
                  )}
                  <NotificationBell />
                  <UserProfileMenu user={user} profile={profile} />
                </div>
              </Suspense>
            </div>
          </div>
          <div className="container mx-auto p-6">
            {profile?.company_id && <SubscriptionAlert companyId={profile.company_id} />}
            {children}
          </div>
        </main>
      </div>
    </LanguageProvider>
  )
}
