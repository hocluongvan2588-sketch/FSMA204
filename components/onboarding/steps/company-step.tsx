"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Building2, MapPin, Phone, Mail, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CompanyStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
  translations: any
}

export default function CompanyStep({ data, onUpdate, onNext, onBack, translations }: CompanyStepProps) {
  const [formData, setFormData] = useState({
    name: data.companyName || "",
    address: data.companyAddress || "",
    city: data.companyCity || "",
    phone: data.companyPhone || "",
    email: data.companyEmail || "",
    website: data.companyWebsite || "",
    exportVolume: data.exportVolume || "",
    description: data.companyDescription || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = translations.onboarding?.required || "Required"
    }
    if (!formData.address.trim()) {
      newErrors.address = translations.onboarding?.required || "Required"
    }
    if (!formData.email.trim()) {
      newErrors.email = translations.onboarding?.required || "Required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = translations.onboarding?.invalidEmail || "Invalid email"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onUpdate({
        companyName: formData.name,
        companyAddress: formData.address,
        companyCity: formData.city,
        companyPhone: formData.phone,
        companyEmail: formData.email,
        companyWebsite: formData.website,
        exportVolume: formData.exportVolume,
        companyDescription: formData.description,
      })
      onNext()
    }
  }

  const exportVolumeOptions = [
    { value: "small", label: "< 10 tấn/tháng" },
    { value: "medium", label: "10-50 tấn/tháng" },
    { value: "large", label: "50-200 tấn/tháng" },
    { value: "enterprise", label: "> 200 tấn/tháng" },
  ]

  const vietnamCities = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "An Giang",
    "Bà Rịa-Vũng Tàu",
    "Bạc Liêu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Dương",
    "Bình Định",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cao Bằng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Tĩnh",
    "Hải Dương",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái",
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {translations.onboarding?.companyInfo || "Thông tin công ty"}
        </h2>
        <p className="text-muted-foreground">
          {translations.onboarding?.companyInfoDesc || "Nhập thông tin cơ bản về công ty của bạn"}
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {translations.onboarding?.companyName || "Tên công ty"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="VD: Công ty TNHH Xuất Khẩu Thủy Sản Việt Nam"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {translations.onboarding?.address || "Địa chỉ"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            placeholder="Số nhà, tên đường"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>

        {/* City/Province */}
        <div className="space-y-2">
          <Label htmlFor="city">{translations.onboarding?.city || "Tỉnh/Thành phố"}</Label>
          <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn tỉnh/thành phố" />
            </SelectTrigger>
            <SelectContent>
              {vietnamCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Info Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {translations.onboarding?.phone || "Số điện thoại"}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+84 123 456 789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {translations.onboarding?.email || "Email"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {translations.onboarding?.website || "Website"}
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://company.com"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>

        {/* Export Volume */}
        <div className="space-y-2">
          <Label htmlFor="exportVolume">
            {translations.onboarding?.exportVolume || "Khối lượng xuất khẩu trung bình"}
          </Label>
          <Select
            value={formData.exportVolume}
            onValueChange={(value) => setFormData({ ...formData, exportVolume: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn khối lượng" />
            </SelectTrigger>
            <SelectContent>
              {exportVolumeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {translations.onboarding?.description || "Mô tả ngắn"} (
            {translations.onboarding?.optional || "Không bắt buộc"})
          </Label>
          <Textarea
            id="description"
            placeholder="Mô tả ngắn về hoạt động kinh doanh của công ty..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          {translations.common?.back || "Quay lại"}
        </Button>
        <Button onClick={handleNext}>
          {translations.common?.next || "Tiếp theo"}: {translations.onboarding?.addFacility || "Thêm cơ sở"}
        </Button>
      </div>
    </div>
  )
}
