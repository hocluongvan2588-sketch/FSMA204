"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function CreateReportPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facilities, setFacilities] = useState<any[]>([])
  const [reportType, setReportType] = useState("internal")
  const [complianceStatus, setComplianceStatus] = useState("compliant")
  const [selectedFacility, setSelectedFacility] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchFacilities = async () => {
      const { data } = await supabase.from("facilities").select("id, name, location_code").order("name")
      setFacilities(data || [])
    }
    fetchFacilities()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      report_number: formData.get("report_number") as string,
      report_type: reportType,
      facility_id: selectedFacility || null,
      audit_date: formData.get("audit_date") as string,
      auditor_name: formData.get("auditor_name") as string,
      auditor_organization: formData.get("auditor_organization") as string,
      findings: formData.get("findings") as string,
      compliance_status: complianceStatus,
      corrective_actions: formData.get("corrective_actions") as string,
      follow_up_date: (formData.get("follow_up_date") as string) || null,
    }

    try {
      const { error: insertError } = await supabase.from("audit_reports").insert(data)

      if (insertError) throw insertError

      router.push("/dashboard/reports")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tạo báo cáo kiểm toán</h1>
        <p className="text-slate-500 mt-1">Ghi nhận kết quả kiểm toán và tuân thủ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin kiểm toán</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="report_number">
                  Số báo cáo <span className="text-red-500">*</span>
                </Label>
                <Input id="report_number" name="report_number" required placeholder="RPT-2024-001" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report_type">
                    Loại báo cáo <span className="text-red-500">*</span>
                  </Label>
                  <Select value={reportType} onValueChange={setReportType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại báo cáo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Kiểm toán nội bộ</SelectItem>
                      <SelectItem value="external">Kiểm toán bên ngoài</SelectItem>
                      <SelectItem value="regulatory">Kiểm toán cơ quan quản lý</SelectItem>
                      <SelectItem value="compliance">Kiểm tra tuân thủ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audit_date">
                    Ngày kiểm toán <span className="text-red-500">*</span>
                  </Label>
                  <Input id="audit_date" name="audit_date" type="date" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility_id">Cơ sở</Label>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn cơ sở (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn cơ sở</SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name} ({facility.location_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auditor_name">
                    Tên kiểm toán viên <span className="text-red-500">*</span>
                  </Label>
                  <Input id="auditor_name" name="auditor_name" required placeholder="Nguyễn Văn A" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auditor_organization">Tổ chức kiểm toán</Label>
                  <Input id="auditor_organization" name="auditor_organization" placeholder="ABC Audit Co." />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="findings">Phát hiện</Label>
                <Textarea
                  id="findings"
                  name="findings"
                  placeholder="Các phát hiện trong quá trình kiểm toán"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compliance_status">
                  Trạng thái tuân thủ <span className="text-red-500">*</span>
                </Label>
                <Select value={complianceStatus} onValueChange={setComplianceStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliant">Tuân thủ</SelectItem>
                    <SelectItem value="non_compliant">Không tuân thủ</SelectItem>
                    <SelectItem value="requires_action">Cần hành động khắc phục</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corrective_actions">Hành động khắc phục</Label>
                <Textarea
                  id="corrective_actions"
                  name="corrective_actions"
                  placeholder="Các hành động cần thực hiện để khắc phục"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Ngày theo dõi</Label>
                <Input id="follow_up_date" name="follow_up_date" type="date" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo báo cáo"}
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
