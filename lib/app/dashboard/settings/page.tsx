import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { Bell, Lock, User, Globe, Palette } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*, companies(name)").eq("id", user.id).single()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground mt-2">Quản lý thông tin cá nhân và tùy chỉnh hệ thống</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Họ và tên</p>
                <p className="text-base font-semibold text-foreground">{profile?.full_name || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                <p className="text-base font-semibold text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Vai trò</p>
                <p className="text-base font-semibold text-foreground capitalize">{profile?.role || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950">
                <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Thông báo</CardTitle>
                <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-foreground">Email thông báo</p>
                  <p className="text-xs text-muted-foreground">Nhận cảnh báo qua email</p>
                </div>
                <div className="text-sm text-emerald-600 font-medium">Đang bật</div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-foreground">Cảnh báo hệ thống</p>
                  <p className="text-xs text-muted-foreground">Thông báo quan trọng</p>
                </div>
                <div className="text-sm text-emerald-600 font-medium">Đang bật</div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Báo cáo hàng tuần</p>
                  <p className="text-xs text-muted-foreground">Tóm tắt hoạt động</p>
                </div>
                <div className="text-sm text-slate-400 font-medium">Đang tắt</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950">
                <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Bảo mật</CardTitle>
                <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-foreground">Mật khẩu</p>
                  <p className="text-xs text-muted-foreground">Thay đổi lần cuối 30 ngày trước</p>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Đổi mật khẩu</button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-foreground">Xác thực 2 bước</p>
                  <p className="text-xs text-muted-foreground">Tăng cường bảo mật</p>
                </div>
                <div className="text-sm text-slate-400 font-medium">Chưa bật</div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Phiên đăng nhập</p>
                  <p className="text-xs text-muted-foreground">Quản lý các thiết bị</p>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Xem chi tiết</button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950">
                <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Giao diện</CardTitle>
                <CardDescription>Tùy chỉnh giao diện hệ thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-foreground">Chế độ tối</p>
                  <p className="text-xs text-muted-foreground">Tự động theo hệ thống</p>
                </div>
                <div className="text-sm text-emerald-600 font-medium">Tự động</div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium text-foreground">Ngôn ngữ</p>
                  <p className="text-xs text-muted-foreground">Tiếng Việt</p>
                </div>
                <div className="text-sm text-slate-400 font-medium">VI</div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Múi giờ</p>
                  <p className="text-xs text-muted-foreground">Asia/Ho_Chi_Minh</p>
                </div>
                <div className="text-sm text-slate-400 font-medium">GMT+7</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {profile?.companies && (
        <Card className="rounded-3xl shadow-lg shadow-slate-900/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950">
                <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Thông tin công ty</CardTitle>
                <CardDescription>Chi tiết về tổ chức của bạn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tên công ty</p>
                <p className="text-base font-semibold text-foreground">{profile.companies.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Mã số thuế</p>
                <p className="text-base font-semibold text-foreground">
                  {profile.companies.registration_number || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
