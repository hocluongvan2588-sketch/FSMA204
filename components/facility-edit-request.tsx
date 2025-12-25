"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { submitFacilityUpdateRequest } from "@/app/actions/facility-update-requests"
import { Edit, Loader2 } from "lucide-react"

interface FacilityEditRequestProps {
  facility: {
    id: string
    name: string
    address: string
    gps_coordinates: string | null
    email: string | null
    phone: string | null
    registration_email: string | null
  }
}

export function FacilityEditRequest({ facility }: FacilityEditRequestProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [name, setName] = useState(facility.name)
  const [address, setAddress] = useState(facility.address)
  const [gpsCoordinates, setGpsCoordinates] = useState(facility.gps_coordinates || "")
  const [email, setEmail] = useState(facility.email || "")
  const [phone, setPhone] = useState(facility.phone || "")
  const [registrationEmail, setRegistrationEmail] = useState(facility.registration_email || "")

  const handleSubmit = async () => {
    // Collect only changed fields
    const changes: Record<string, any> = {}

    if (name !== facility.name) changes.name = name
    if (address !== facility.address) changes.address = address
    if (gpsCoordinates !== (facility.gps_coordinates || "")) changes.gps_coordinates = gpsCoordinates
    if (email !== (facility.email || "")) changes.email = email
    if (phone !== (facility.phone || "")) changes.phone = phone
    if (registrationEmail !== (facility.registration_email || "")) changes.registration_email = registrationEmail

    if (Object.keys(changes).length === 0) {
      toast({
        variant: "destructive",
        title: "Không có thay đổi",
        description: "Bạn chưa thay đổi thông tin nào",
      })
      return
    }

    setLoading(true)

    const result = await submitFacilityUpdateRequest({
      facility_id: facility.id,
      requested_changes: changes,
    })

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Lỗi tạo yêu cầu",
        description: result.error,
      })
    } else {
      toast({
        title: "Yêu cầu đã gửi",
        description: "Yêu cầu cập nhật đã được gửi đến System Admin để xét duyệt",
      })
      setShowDialog(false)
    }

    setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)} className="gap-2">
        <Edit className="h-4 w-4" />
        Yêu cầu cập nhật
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yêu cầu cập nhật thông tin cơ sở</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Các thay đổi sẽ được gửi đến System Admin để phê duyệt. Bạn không thể thay đổi thông tin FDA và US Agent
              (đã khóa).
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên cơ sở</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên cơ sở" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gps">Tọa độ GPS</Label>
              <Input
                id="gps"
                value={gpsCoordinates}
                onChange={(e) => setGpsCoordinates(e.target.value)}
                placeholder="Ví dụ: 10.8231, 106.6297"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+84 123 456 789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationEmail">Email đăng ký</Label>
              <Input
                id="registrationEmail"
                type="email"
                value={registrationEmail}
                onChange={(e) => setRegistrationEmail(e.target.value)}
                placeholder="registration@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
