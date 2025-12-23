import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SecuritySettings } from "@/components/security-settings"

export default async function SecurityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bảo mật</h1>
        <p className="text-slate-500 mt-1">Quản lý mật khẩu và cài đặt bảo mật tài khoản</p>
      </div>

      <SecuritySettings user={user} profile={profile} />
    </div>
  )
}
