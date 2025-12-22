"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import WelcomeStep from "./steps/welcome-step"
import IndustryStep from "./steps/industry-step"
import CompanyStep from "./steps/company-step"
import FacilityStep from "./steps/facility-step"
import ProductStep from "./steps/product-step"
import CompleteStep from "./steps/complete-step"

interface OnboardingWizardProps {
  profile: any
}

export type IndustryType = "seafood" | "produce" | "processed" | "other"

export interface OnboardingData {
  industry: IndustryType | null
  exportVolume: string
  company: {
    name: string
    registration_number: string
    address: string
    phone: string
    email: string
    contact_person: string
  } | null
  facilities: Array<{
    name: string
    facility_type: string
    location_code: string
    address: string
    gps_coordinates?: string
  }>
  products: Array<{
    product_code: string
    product_name: string
    product_name_vi: string
    category: string
    is_ftl: boolean
    unit_of_measure: string
  }>
}

const TOTAL_STEPS = 6

export default function OnboardingWizard({ profile }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    industry: null,
    exportVolume: "",
    company: profile?.companies
      ? {
          name: profile.companies.name,
          registration_number: "",
          address: "",
          phone: "",
          email: "",
          contact_person: profile.full_name || "",
        }
      : null,
    facilities: [],
    products: [],
  })

  const updateData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const skipToEnd = () => {
    setCurrentStep(TOTAL_STEPS - 1)
  }

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Thiết lập hệ thống FSMA 204</h1>
        </div>
        <p className="text-slate-600">
          Chúng tôi sẽ hướng dẫn bạn từng bước. Mất khoảng <span className="font-semibold">10-15 phút</span> để hoàn
          thành
        </p>
      </div>

      {/* Progress Bar */}
      {currentStep > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Bước {currentStep + 1} / {TOTAL_STEPS}
            </span>
            <span className="text-sm text-slate-500">{Math.round(progress)}% hoàn thành</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Steps */}
      <div className="mb-8">
        {currentStep === 0 && <WelcomeStep onNext={nextStep} />}

        {currentStep === 1 && (
          <IndustryStep data={onboardingData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
        )}

        {currentStep === 2 && (
          <CompanyStep data={onboardingData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
        )}

        {currentStep === 3 && (
          <FacilityStep
            data={onboardingData}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            onSkip={nextStep}
          />
        )}

        {currentStep === 4 && (
          <ProductStep
            data={onboardingData}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            onSkip={skipToEnd}
          />
        )}

        {currentStep === 5 && <CompleteStep data={onboardingData} profile={profile} />}
      </div>

      {/* Help Text */}
      {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Cần trợ giúp? <button className="text-blue-600 hover:underline font-medium">Chat với chúng tôi</button> hoặc{" "}
            <button className="text-blue-600 hover:underline font-medium">Xem hướng dẫn video</button>
          </p>
        </div>
      )}
    </div>
  )
}
