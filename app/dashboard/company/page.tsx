import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function CompanyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*, companies(*)").eq("id", user.id).single()

  const hasCompany = profile?.company_id && profile?.companies

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Thông tin công ty</h1>
          <p className="text-slate-500 mt-1">Quản lý thông tin doanh nghiệp của bạn</p>
        </div>
        {hasCompany && (profile?.role === "admin" || profile?.role === "manager") && (
          <Button asChild>
            <Link href="/dashboard/company/edit">Chỉnh sửa</Link>
          </Button>
        )}
      </div>

      {!hasCompany ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có thông tin công ty</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">
              Bạn chưa được gán vào công ty nào. Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </p>
            <Button asChild>
              <Link href="/dashboard/company/create">Tạo công ty mới</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết công ty</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500 mb-1">Tên công ty</dt>
                <dd className="text-base text-slate-900">{profile.companies.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 mb-1">Mã số đăng ký kinh doanh</dt>
                <dd className="text-base text-slate-900">{profile.companies.registration_number}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500 mb-1">Địa chỉ</dt>
                <dd className="text-base text-slate-900">{profile.companies.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 mb-1">Số điện thoại</dt>
                <dd className="text-base text-slate-900">{profile.companies.phone || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 mb-1">Email</dt>
                <dd className="text-base text-slate-900">{profile.companies.email || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 mb-1">Người liên hệ</dt>
                <dd className="text-base text-slate-900">{profile.companies.contact_person || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 mb-1">Ngày tạo</dt>
                <dd className="text-base text-slate-900">
                  {new Date(profile.companies.created_at).toLocaleDateString("vi-VN")}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
