"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle, Sparkles } from "lucide-react"
import { useTourStore } from "@/lib/utils/onboarding-tour"
import { Badge } from "@/components/ui/badge"

export function TourLauncher() {
  const { startTour, hasSeenTour } = useTourStore()

  return (
    <div className="relative">
      {!hasSeenTour && (
        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-1.5 py-0.5 text-[10px] animate-pulse">
          Mới
        </Badge>
      )}
      <Button
        variant={hasSeenTour ? "outline" : "default"}
        size="sm"
        onClick={startTour}
        className={`gap-2 ${hasSeenTour ? "bg-transparent" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"}`}
      >
        {hasSeenTour ? <HelpCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {hasSeenTour ? "Xem lại hướng dẫn" : "Hướng dẫn sử dụng"}
      </Button>
    </div>
  )
}
