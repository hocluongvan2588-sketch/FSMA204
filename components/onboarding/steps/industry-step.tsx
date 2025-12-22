"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { OnboardingData, IndustryType } from "../onboarding-wizard"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface IndustryStepProps {
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const industries = [
  {
    id: "seafood" as IndustryType,
    name: "Thủy hải sản",
    nameEn: "Seafood",
    icon: "🦐",
    description: "Tôm, cá, mực, nghêu sò... xuất khẩu tươi hoặc đông lạnh",
    examples: ["Tôm sú", "Tôm thẻ", "Cá tra", "Basa", "Mực ống"],
    popular: true,
  },
  {
    id: "produce" as IndustryType,
    name: "Nông sản tươi",
    nameEn: "Fresh Produce",
    icon: "🥭",
    description: "Trái cây, rau củ tươi hoặc đông lạnh",
    examples: ["Thanh long", "Xoài", "Vải thiều", "Chuối", "Dứa"],
    popular: true,
  },
  {
    id: "processed" as IndustryType,
    name: "Thực phẩm chế biến",
    nameEn: "Processed Foods",
    icon: "🍱",
    description: "Sản phẩm chế biến, đóng gói, nước ép, đồ hộp",
    examples: ["Nước ép trái cây", "Đồ hộp", "Gia vị", "Chả cá"],
    popular: false,
  },
  {
    id: "other" as IndustryType,
    name: "Khác",
    nameEn: "Other",
    icon: "📦",
    description: "Ngành hàng khác thuộc danh sách FTL của FDA",
    examples: [],
    popular: false,
  },
]

const exportVolumes = [
  { value: "small", label: "< 10 tấn/tháng", description: "Quy mô nhỏ, mới bắt đầu xuất khẩu" },
  { value: "medium", label: "10-50 tấn/tháng", description: "Quy mô vừa, xuất khẩu ổn định" },
  { value: "large", label: "50-200 tấn/tháng", description: "Quy mô lớn, nhiều đối tác" },
  { value: "enterprise", label: "> 200 tấn/tháng", description: "Doanh nghiệp lớn, xuất khẩu quy mô" },
]

export default function IndustryStep({ data, updateData, onNext, onBack }: IndustryStepProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(data.industry)
  const [selectedVolume, setSelectedVolume] = useState<string>(data.exportVolume || "")

  const handleNext = () => {
    if (selectedIndustry && selectedVolume) {
      updateData({
        industry: selectedIndustry,
        exportVolume: selectedVolume,
      })
      onNext()
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            Bước 1/4
          </Badge>
          <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">Quan trọng</Badge>
        </div>
        <CardTitle className="text-2xl">Ngành hàng của bạn</CardTitle>
        <CardDescription className="text-base">
          Giúp chúng tôi hiểu doanh nghiệp của bạn để đề xuất quy trình phù hợp nhất
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Industry Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Chọn ngành hàng xuất khẩu chính *</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`relative text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedIndustry === industry.id
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                {industry.popular && <Badge className="absolute top-2 right-2 text-xs bg-teal-500">Phổ biến</Badge>}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{industry.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{industry.name}</h3>
                    <p className="text-xs text-slate-600 mb-2">{industry.description}</p>
                    {industry.examples.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {industry.examples.slice(0, 3).map((ex, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedIndustry === industry.id && (
                    <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Export Volume */}
        {selectedIndustry && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <Label className="text-base font-semibold">Khối lượng xuất khẩu ước tính *</Label>
            <RadioGroup value={selectedVolume} onValueChange={setSelectedVolume}>
              <div className="space-y-2">
                {exportVolumes.map((volume) => (
                  <label
                    key={volume.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-50 ${
                      selectedVolume === volume.value ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem value={volume.value} id={volume.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{volume.label}</div>
                      <div className="text-sm text-slate-600">{volume.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Info Box */}
        {selectedIndustry && selectedVolume && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-teal-900">
                <p className="font-medium mb-1">
                  Tuyệt vời! Chúng tôi sẽ tùy chỉnh hệ thống cho ngành{" "}
                  {industries.find((i) => i.id === selectedIndustry)?.name}
                </p>
                <p className="text-teal-700">
                  Bạn sẽ nhận được: Mẫu quy trình chuẩn, danh sách sản phẩm phổ biến, và checklist FDA đầy đủ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedIndustry || !selectedVolume}
            className="bg-gradient-to-r from-blue-600 to-teal-600"
          >
            Tiếp tục
            <svg className="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
