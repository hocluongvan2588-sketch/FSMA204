"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Factory, Warehouse, Sprout, Building2, MapPin, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FacilityStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
  translations: any
}

export default function FacilityStep({ data, onUpdate, onNext, onBack, translations }: FacilityStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: data.facilityName || "",
    type: data.facilityType || "",
    address: data.facilityAddress || "",
    fdaFrn: data.facilityFdaFrn || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Industry-specific facility templates
  const getTemplates = () => {
    const industry = data.industry || "seafood"

    const templates = {
      seafood: [
        {
          id: "processing",
          icon: Factory,
          name: "Nhà máy chế biến",
          nameEn: "Processing Plant",
          type: "processing",
          description: "Cơ sở chế biến thủy sản (tôm, cá)",
        },
        {
          id: "cold-storage",
          icon: Warehouse,
          name: "Kho lạnh",
          nameEn: "Cold Storage",
          type: "cold_storage",
          description: "Bảo quản lạnh sản phẩm",
        },
        {
          id: "farm",
          icon: Sprout,
          name: "Ao/Đầm nuôi",
          nameEn: "Aquaculture Farm",
          type: "farm",
          description: "Khu vực nuôi trồng thủy sản",
        },
      ],
      produce: [
        {
          id: "farm",
          icon: Sprout,
          name: "Nông trại",
          nameEn: "Farm",
          type: "farm",
          description: "Khu vực trồng trọt",
        },
        {
          id: "packing",
          icon: Factory,
          name: "Nhà đóng gói",
          nameEn: "Packing House",
          type: "packing",
          description: "Phân loại & đóng gói sản phẩm",
        },
        {
          id: "cold-storage",
          icon: Warehouse,
          name: "Kho bảo quản lạnh",
          nameEn: "Cold Storage",
          type: "cold_storage",
          description: "Bảo quản lạnh nông sản",
        },
      ],
    }

    return templates[industry] || templates.seafood
  }

  const templates = getTemplates()

  const selectTemplate = (template: any) => {
    setSelectedTemplate(template.id)
    setFormData({
      ...formData,
      name: template.nameEn,
      type: template.type,
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = translations.onboarding?.required || "Required"
    }
    if (!formData.type) {
      newErrors.type = translations.onboarding?.required || "Required"
    }
    if (!formData.address.trim()) {
      newErrors.address = translations.onboarding?.required || "Required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onUpdate({
        facilityName: formData.name,
        facilityType: formData.type,
        facilityAddress: formData.address,
        facilityFdaFrn: formData.fdaFrn,
      })
      onNext()
    }
  }

  const handleSkip = () => {
    onUpdate({
      facilityName: null,
      facilityType: null,
      facilityAddress: null,
      facilityFdaFrn: null,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {translations.onboarding?.addFacility || "Thêm cơ sở đầu tiên"}
        </h2>
        <p className="text-muted-foreground">
          {translations.onboarding?.facilityDesc || "Mỗi facility là một địa điểm: nhà máy, kho, farm..."}
        </p>
      </div>

      {/* Quick Templates */}
      <div className="space-y-3">
        <Label>{translations.onboarding?.quickTemplates || "Mẫu nhanh"}</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all hover:border-primary ${
                  selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => selectTemplate(template)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={`p-3 rounded-full ${selectedTemplate === template.id ? "bg-primary/20" : "bg-muted"}`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        selectedTemplate === template.id ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {translations.onboarding?.facilityName || "Tên cơ sở"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="VD: Processing Plant #1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">
            {translations.onboarding?.facilityType || "Loại cơ sở"} <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className={errors.type ? "border-destructive" : ""}>
              <SelectValue placeholder="Chọn loại cơ sở" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="farm">Farm / Nông trại</SelectItem>
              <SelectItem value="processing">Processing Plant / Nhà máy chế biến</SelectItem>
              <SelectItem value="packing">Packing House / Nhà đóng gói</SelectItem>
              <SelectItem value="cold_storage">Cold Storage / Kho lạnh</SelectItem>
              <SelectItem value="warehouse">Warehouse / Kho hàng</SelectItem>
              <SelectItem value="distribution">Distribution Center / Trung tâm phân phối</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {translations.onboarding?.address || "Địa chỉ"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            placeholder="Địa chỉ đầy đủ của cơ sở"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fdaFrn" className="flex items-center gap-2">
            FDA FRN
            <span className="text-xs text-muted-foreground font-normal">
              ({translations.onboarding?.optional || "Không bắt buộc"})
            </span>
          </Label>
          <Input
            id="fdaFrn"
            placeholder="Food Facility Registration Number"
            value={formData.fdaFrn}
            onChange={(e) => setFormData({ ...formData, fdaFrn: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {translations.onboarding?.fdaFrnHelp || "Số đăng ký cơ sở với FDA (nếu có)"}
          </p>
        </div>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {translations.onboarding?.facilityNote ||
            "Bạn có thể thêm nhiều facilities sau. Hiện tại chỉ cần 1 để bắt đầu."}
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          {translations.common?.back || "Quay lại"}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            {translations.common?.skip || "Bỏ qua"}
          </Button>
          <Button onClick={handleNext}>
            {translations.common?.next || "Tiếp theo"}: {translations.onboarding?.addProduct || "Thêm sản phẩm"}
          </Button>
        </div>
      </div>
    </div>
  )
}
