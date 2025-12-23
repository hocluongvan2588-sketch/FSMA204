import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*, companies(name)").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 mt-1">Quản lý thông tin tài khoản và cài đặt của bạn</p>
      </div>

      <ProfileForm user={user} profile={profile} />
    </div>
  )
}
