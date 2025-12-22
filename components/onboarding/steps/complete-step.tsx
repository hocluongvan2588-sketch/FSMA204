"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Package, Building2, Factory, ArrowRight, FileText, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

interface CompleteStepProps {
  data: any
  translations: any
}

export default function CompleteStep({ data, translations }: CompleteStepProps) {
  const router = useRouter()

  const completedSteps = [
    {
      icon: Building2,
      title: translations.onboarding?.companyProfile || "Company Profile",
      value: data.companyName || "Not set",
      completed: !!data.companyName,
    },
    {
      icon: Factory,
      title: translations.onboarding?.facility || "Facility",
      value: data.facilityName || "Skipped",
      completed: !!data.facilityName,
    },
    {
      icon: Package,
      title: translations.onboarding?.product || "Product",
      value: data.productName || "Skipped",
      completed: !!data.productName,
    },
  ]

  const nextSteps = [
    {
      icon: Package,
      title: translations.onboarding?.recordFirstEvent || "Ghi lại sự kiện đầu tiên",
      description: translations.onboarding?.recordFirstEventDesc || "Tạo harvest, cooling, hoặc packing event",
      action: () => router.push("/dashboard/cte/new"),
      variant: "default" as const,
    },
    {
      icon: FileText,
      title: translations.onboarding?.viewDashboard || "Xem Dashboard",
      description: translations.onboarding?.viewDashboardDesc || "Tổng quan hoạt động và thống kê",
      action: () => router.push("/dashboard"),
      variant: "outline" as const,
    },
    {
      icon: BookOpen,
      title: translations.onboarding?.learnMore || "Tìm hiểu thêm",
      description: translations.onboarding?.learnMoreDesc || "Hướng dẫn FSMA 204 và best practices",
      action: () => router.push("/dashboard/help"),
      variant: "outline" as const,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{translations.onboarding?.allSet || "Đã hoàn tất!"}</h2>
          <p className="text-muted-foreground mt-2 text-lg">
            {translations.onboarding?.setupComplete || "Hệ thống của bạn đã sẵn sàng để sử dụng"}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">{translations.onboarding?.summary || "Tóm tắt cài đặt"}</h3>
        <div className="space-y-4">
          {completedSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${step.completed ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${step.completed ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.value}</p>
                </div>
                {step.completed && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Next Steps */}
      <div className="space-y-4">
        <h3 className="font-semibold">{translations.onboarding?.nextSteps || "Bước tiếp theo"}</h3>
        <div className="grid gap-4">
          {nextSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card
                key={index}
                className="p-5 hover:border-primary transition-all cursor-pointer group"
                onClick={step.action}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-6 w-6 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={() => router.push("/dashboard")}>
          {translations.onboarding?.goToDashboard || "Vào Dashboard"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
