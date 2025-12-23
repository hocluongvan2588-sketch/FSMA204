"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface SecuritySettingsProps {
  user: User
  profile: any
}

export function SecuritySettings({ user, profile }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChanging, setIsChanging] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  const handleChangePassword = async () => {
    setMessage(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" })
      return
    }

    setIsChanging(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Đã đổi mật khẩu thành công!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Không thể đổi mật khẩu" })
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">Mật khẩu mới *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <Button onClick={handleChangePassword} disabled={isChanging} className="w-full">
              {isChanging ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phiên đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Trình duyệt hiện tại</p>
                  <p className="text-sm text-slate-500">Đang hoạt động</p>
                </div>
              </div>
              <Badge variant="default">Phiên hiện tại</Badge>
            </div>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = "/auth/login"
              }}
            >
              Đăng xuất khỏi tất cả thiết bị
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bảo mật tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Email đã xác minh</p>
                <p className="text-xs text-slate-500 mt-1">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Mật khẩu mạnh</p>
                <p className="text-xs text-slate-500 mt-1">Đã được mã hóa an toàn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-900">Lời khuyên bảo mật</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Sử dụng mật khẩu mạnh và duy nhất</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Thay đổi mật khẩu định kỳ</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Không chia sẻ mật khẩu với người khác</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
