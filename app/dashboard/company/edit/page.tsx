"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function EditCompanyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

        if (profile?.company_id) {
          const { data } = await supabase.from("companies").select("*").eq("id", profile.company_id).single()
          setCompany(data)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsFetching(false)
      }
    }

    fetchCompany()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      registration_number: formData.get("registration_number") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      contact_person: formData.get("contact_person") as string,
    }

    try {
      const { error: updateError } = await supabase.from("companies").update(data).eq("id", company.id)

      if (updateError) throw updateError

      router.push("/dashboard/company")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy thông tin công ty</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Chỉnh sửa công ty</h1>
        <p className="text-slate-500 mt-1">Cập nhật thông tin doanh nghiệp</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin công ty</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên công ty <span className="text-red-500">*</span>
                </Label>
                <Input id="name" name="name" required defaultValue={company.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">
                  Mã số đăng ký kinh doanh <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  required
                  defaultValue={company.registration_number}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Địa chỉ <span className="text-red-500">*</span>
                </Label>
                <Textarea id="address" name="address" required defaultValue={company.address} rows={3} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={company.phone || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={company.email || ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Người liên hệ</Label>
                <Input id="contact_person" name="contact_person" defaultValue={company.contact_person || ""} />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
