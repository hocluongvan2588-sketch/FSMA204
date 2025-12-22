"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
  translations: any
}

export default function ProductStep({ data, onUpdate, onNext, onBack, translations }: ProductStepProps) {
  const [formData, setFormData] = useState({
    name: data.productName || "",
    isFtl: data.productIsFtl || false,
    lotCodeFormat: data.productLotCodeFormat || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Industry-specific common products
  const getCommonProducts = () => {
    const industry = data.industry || "seafood"

    const products = {
      seafood: [
        { name: "White Shrimp (HOSO)", isFtl: true },
        { name: "White Shrimp (HLSO)", isFtl: true },
        { name: "Black Tiger Shrimp", isFtl: true },
        { name: "Vannamei Shrimp", isFtl: true },
        { name: "Pangasius Fillet", isFtl: true },
        { name: "Tilapia Fillet", isFtl: true },
      ],
      produce: [
        { name: "Dragon Fruit (Fresh)", isFtl: true },
        { name: "Mango (Fresh)", isFtl: true },
        { name: "Lychee (Fresh)", isFtl: true },
        { name: "Longan (Fresh)", isFtl: true },
        { name: "Spinach (Fresh)", isFtl: true },
        { name: "Herbs (Fresh)", isFtl: true },
      ],
    }

    return products[industry] || products.seafood
  }

  const commonProducts = getCommonProducts()

  const selectCommonProduct = (product: any) => {
    setFormData({
      name: product.name,
      isFtl: product.isFtl,
      lotCodeFormat: "",
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = translations.onboarding?.required || "Required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onUpdate({
        productName: formData.name,
        productIsFtl: formData.isFtl,
        productLotCodeFormat: formData.lotCodeFormat,
      })
      onNext()
    }
  }

  const handleSkip = () => {
    onUpdate({
      productName: null,
      productIsFtl: false,
      productLotCodeFormat: null,
    })
    onNext()
  }

  const lotCodeExamples = [
    { format: "YYMMDD-##", example: "250115-01" },
    { format: "LOT-YYMMDD", example: "LOT-250115" },
    { format: "YYYYMMDD-###", example: "20250115-001" },
    { format: "Custom format", example: "Your choice" },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {translations.onboarding?.addProduct || "Thêm sản phẩm đầu tiên"}
        </h2>
        <p className="text-muted-foreground">
          {translations.onboarding?.productDesc || "Thêm 1-2 sản phẩm để bắt đầu. Bạn có thể thêm nhiều hơn sau."}
        </p>
      </div>

      {/* Common Products */}
      <div className="space-y-3">
        <Label>{translations.onboarding?.commonProducts || "Sản phẩm phổ biến"}</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {commonProducts.map((product, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto py-3 px-4 bg-transparent"
              onClick={() => selectCommonProduct(product)}
            >
              <div className="flex items-center gap-3 w-full">
                <Plus className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{product.name}</p>
                  {product.isFtl && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      FTL Product
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Product Form */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {translations.onboarding?.productName || "Tên sản phẩm"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="VD: White Shrimp HOSO"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* FTL Checkbox */}
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id="ftl"
            checked={formData.isFtl}
            onCheckedChange={(checked) => setFormData({ ...formData, isFtl: checked as boolean })}
          />
          <div className="space-y-1">
            <Label htmlFor="ftl" className="text-base font-medium cursor-pointer">
              {translations.onboarding?.ftlProduct || "FTL Food (Food Traceability List)"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {translations.onboarding?.ftlDesc ||
                "Sản phẩm này nằm trong danh sách FDA yêu cầu truy xuất nguồn gốc chi tiết"}
            </p>
          </div>
        </div>

        {/* Lot Code Format */}
        <div className="space-y-3">
          <Label htmlFor="lotCode">
            {translations.onboarding?.lotCodeFormat || "Định dạng Lot Code"} (
            {translations.onboarding?.optional || "Không bắt buộc"})
          </Label>
          <Input
            id="lotCode"
            placeholder="VD: YYMMDD-##"
            value={formData.lotCodeFormat}
            onChange={(e) => setFormData({ ...formData, lotCodeFormat: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            {lotCodeExamples.map((example, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-auto py-2"
                onClick={() => setFormData({ ...formData, lotCodeFormat: example.format })}
              >
                <div className="text-left">
                  <p className="font-medium">{example.format}</p>
                  <p className="text-muted-foreground">VD: {example.example}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {translations.onboarding?.productNote ||
            "Không cần thêm tất cả sản phẩm ngay. Bạn có thể import từ Excel sau."}
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
          <Button onClick={handleNext}>{translations.common?.complete || "Hoàn thành"}</Button>
        </div>
      </div>
    </div>
  )
}
