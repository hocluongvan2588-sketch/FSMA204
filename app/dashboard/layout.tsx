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

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

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
