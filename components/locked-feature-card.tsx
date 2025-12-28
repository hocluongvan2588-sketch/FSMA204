"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"

interface LockedFeatureCardProps {
  title: string
  description: string
  features: string[]
  requiredPackage: string
  currentPackage: string
  icon?: React.ComponentType<{ className?: string }>
  previewImage?: string
}

export function LockedFeatureCard({
  title,
  description,
  features,
  requiredPackage,
  currentPackage,
  icon: Icon,
  previewImage,
}: LockedFeatureCardProps) {
  return (
    <Card className="border-2 border-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-slate-100/90 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Tính năng cao cấp</h3>
          <p className="text-sm text-slate-600 mb-4">
            Nâng cấp lên <span className="font-semibold text-emerald-600">{requiredPackage}</span> để mở khóa tính năng
            này
          </p>

          <div className="bg-white rounded-lg p-4 mb-4 text-left shadow-sm">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Bạn sẽ được sử dụng:</p>
            <ul className="space-y-2">
              {features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs text-slate-600">
                Hiện tại: {currentPackage}
              </Badge>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
              <Badge variant="default" className="text-xs bg-emerald-600">
                Nâng cấp: {requiredPackage}
              </Badge>
            </div>
            <Button
              asChild
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 gap-2 shadow-md"
            >
              <Link href="/admin/pricing">
                <Sparkles className="h-4 w-4" />
                Xem gói dịch vụ
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="blur-sm pointer-events-none select-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-emerald-100">
                <Icon className="h-5 w-5 text-emerald-700" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {previewImage ? (
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
