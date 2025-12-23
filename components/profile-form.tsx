"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface ProfileFormProps {
  user: User
  profile: any
}

export function ProfileForm({ user, profile: initialProfile }: ProfileFormProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [fullName, setFullName] = useState(initialProfile.full_name || "")
  const [phone, setPhone] = useState(initialProfile.phone || "")
  const [languagePreference, setLanguagePreference] = useState(initialProfile.language_preference || "vi")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  const handleSave = async () => {
    if (!fullName.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập họ tên" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          language_preference: languagePreference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      setMessage({ type: "success", text: "Đã cập nhật hồ sơ thành công!" })

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Có lỗi xảy ra" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-500 mt-1">Email không thể thay đổi</p>
            </div>

            <div>
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select value={languagePreference} onValueChange={setLanguagePreference}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </CardContent>
        </Card>

        {profile.companies && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin công ty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Tên công ty</p>
                <p className="font-medium mt-1">{profile.companies.name}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vai trò & Quyền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-2">Vai trò hiện tại</p>
              <Badge className="text-sm px-3 py-1">
                {profile.role === "system_admin"
                  ? "System Admin"
                  : profile.role === "admin"
                    ? "Admin"
                    : profile.role === "manager"
                      ? "Manager"
                      : profile.role === "operator"
                        ? "Operator"
                        : "Viewer"}
              </Badge>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-slate-900 mb-2">Quyền truy cập</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {profile.role === "system_admin" && (
                  <>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Toàn quyền hệ thống
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Quản lý tất cả công ty
                    </li>
                  </>
                )}
                {(profile.role === "admin" || profile.role === "manager") && (
                  <>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Quản lý công ty
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tạo và chỉnh sửa dữ liệu
                    </li>
                  </>
                )}
                {profile.role === "operator" && (
                  <>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Thêm dữ liệu mới
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cập nhật hồ sơ
                    </li>
                  </>
                )}
                {profile.role === "viewer" && (
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Xem dữ liệu
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">ID tài khoản</p>
              <p className="font-mono text-xs mt-1 text-slate-700">{profile.id}</p>
            </div>
            <div>
              <p className="text-slate-500">Ngày tạo</p>
              <p className="font-medium mt-1">
                {new Date(profile.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Cập nhật lần cuối</p>
              <p className="font-medium mt-1">
                {new Date(profile.updated_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
