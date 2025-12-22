import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { LanguageProvider } from "@/contexts/language-context"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[v0] Dashboard Layout - User ID:", user.id)
  console.log("[v0] Dashboard Layout - Profile:", profile)
  console.log("[v0] Dashboard Layout - Role:", profile?.role)

  if (profile?.role === "system_admin") {
    console.log("[v0] Dashboard Layout - Redirecting system_admin to /admin")
    redirect("/admin")
  }

  return (
    <LanguageProvider>
      <div className="flex min-h-screen">
        <DashboardNav user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </LanguageProvider>
  )
}
