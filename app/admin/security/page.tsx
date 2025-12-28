import { AdminMFASettings } from "@/components/admin-mfa-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Activity, AlertTriangle } from "lucide-react"

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Bảo mật</h1>
        <p className="text-slate-500 mt-2 text-lg">Quản lý cài đặt bảo mật và xác thực cho tài khoản admin</p>
      </div>

      <div className="grid gap-6">
        <AdminMFASettings />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Hoạt động bảo mật
            </CardTitle>
            <CardDescription>Theo dõi các hoạt động đăng nhập và bảo mật của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Xem chi tiết hoạt động trong System Logs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Khuyến nghị bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Bật xác thực 2 yếu tố (2FA) để bảo vệ tài khoản</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Sử dụng mật khẩu mạnh và duy nhất</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Kiểm tra hoạt động đăng nhập thường xuyên</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Đăng xuất khi không sử dụng</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
