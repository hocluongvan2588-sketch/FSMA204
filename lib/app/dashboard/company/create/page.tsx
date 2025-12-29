"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateCompanyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    // Only system_admin can create companies
    if (profile?.role === "system_admin") {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    let formData: FormData
    try {
      formData = new FormData(e.currentTarget)
    } catch (err) {
      console.error("[v0] FormData construction error:", err)
      setError("Lỗi khi xử lý form. Vui lòng thử lại.")
      setIsLoading(false)
      return
    }

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

  if (isAuthorized === null) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (isAuthorized === false) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-8">
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <ShieldAlert className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Quyền truy cập bị từ chối</h3>
                <p className="text-sm text-slate-700">
                  Chức năng tạo công ty chỉ dành cho <strong>System Administrator</strong>.
                </p>
              </div>

              <div className="bg-white border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Tại sao bị hạn chế?</h4>
                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                  <li>
                    <strong>Tuân thủ FDA:</strong> Mỗi company cần được xác minh trước khi đăng ký FDA
                  </li>
                  <li>
                    <strong>Bảo mật:</strong> Ngăn tạo company không được ủy quyền
                  </li>
                  <li>
                    <strong>Audit trail:</strong> Tất cả company creations phải được ghi log bởi admin
                  </li>
                </ul>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Bạn cần gì?</h4>
                <p className="text-sm text-slate-700 mb-2">Liên hệ System Administrator để:</p>
                <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                  <li>Tạo company mới cho tổ chức của bạn</li>
                  <li>Được assign vào company hiện tại</li>
                  <li>Yêu cầu thay đổi thông tin company</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Về Dashboard
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard/company">Xem thông tin công ty</Link>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // If authorized (system_admin), redirect to admin panel
  router.push("/admin/users")
  return null
}
