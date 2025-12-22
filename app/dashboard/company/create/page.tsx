"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function CreateCompanyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

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
      const { data: company, error: companyError } = await supabase.from("companies").insert(data).select().single()

      if (companyError) throw companyError

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ company_id: company.id })
          .eq("id", user.id)

        if (profileError) throw profileError
      }

      toast({
        title: "✅ Tạo công ty thành công!",
        description: `Đã tạo công ty "${data.name}" với MST ${data.registration_number}`,
      })

      router.push("/dashboard/company")
      router.refresh()
    } catch (err: any) {
      const errorMessage = err.message || "Đã xảy ra lỗi"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "❌ Lỗi tạo công ty",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo công ty mới</h1>
        <p className="text-slate-500 mt-1">Nhập thông tin doanh nghiệp của bạn</p>
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
                <Input id="name" name="name" required placeholder="Công ty TNHH ABC" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">
                  Mã số đăng ký kinh doanh <span className="text-red-500">*</span>
                </Label>
                <Input id="registration_number" name="registration_number" required placeholder="MST-0123456789" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Địa chỉ <span className="text-red-500">*</span>
                </Label>
                <Textarea id="address" name="address" required placeholder="123 Đường ABC, Quận 1, TP.HCM" rows={3} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+84 28 1234 5678" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="contact@company.vn" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Người liên hệ</Label>
                <Input id="contact_person" name="contact_person" placeholder="Nguyễn Văn A" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo công ty"}
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
