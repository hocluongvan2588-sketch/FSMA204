"use client"

import { useEffect, useState } from "react"
import { useTourStore, TOUR_STEPS } from "@/lib/utils/onboarding-tour"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function InteractiveTour() {
  const { isActive, currentStep, nextStep, prevStep, skipTour, completeTour } = useTourStore()
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)

  const currentTourStep = TOUR_STEPS[currentStep]

  useEffect(() => {
    if (!isActive || !currentTourStep) return

    const updateSpotlight = () => {
      const element = document.querySelector(currentTourStep.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setSpotlightRect(rect)
      }
    }

    updateSpotlight()
    window.addEventListener("resize", updateSpotlight)
    window.addEventListener("scroll", updateSpotlight)

    return () => {
      window.removeEventListener("resize", updateSpotlight)
      window.removeEventListener("scroll", updateSpotlight)
    }
  }, [isActive, currentStep, currentTourStep])

  if (!isActive || !currentTourStep) return null

  const padding = currentTourStep.spotlightPadding || 10

  return (
    <>
      {/* Overlay mờ */}
      <div className="fixed inset-0 bg-black/50 z-[100] pointer-events-none" />

      {/* Spotlight */}
      {spotlightRect && (
        <>
          <div
            className="fixed z-[101] border-2 border-blue-500 rounded-lg pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300"
            style={{
              top: spotlightRect.top - padding,
              left: spotlightRect.left - padding,
              width: spotlightRect.width + padding * 2,
              height: spotlightRect.height + padding * 2,
            }}
          />
        </>
      )}

      {/* Tour card */}
      <Card
        className={cn(
          "fixed z-[102] w-80 shadow-xl",
          currentTourStep.position === "bottom" && spotlightRect && "top-[calc(var(--spotlight-bottom)+20px)]",
          currentTourStep.position === "top" && spotlightRect && "bottom-[calc(100vh-var(--spotlight-top)+20px)]",
          currentTourStep.position === "left" && spotlightRect && "right-[calc(100vw-var(--spotlight-left)+20px)]",
          currentTourStep.position === "right" && spotlightRect && "left-[calc(var(--spotlight-right)+20px)]",
        )}
        style={
          spotlightRect
            ? ({
                "--spotlight-top": `${spotlightRect.top}px`,
                "--spotlight-bottom": `${spotlightRect.bottom}px`,
                "--spotlight-left": `${spotlightRect.left}px`,
                "--spotlight-right": `${spotlightRect.right}px`,
                ...(currentTourStep.position === "bottom" && {
                  top: `${spotlightRect.bottom + 20}px`,
                  left: `${spotlightRect.left}px`,
                }),
                ...(currentTourStep.position === "top" && {
                  bottom: `${window.innerHeight - spotlightRect.top + 20}px`,
                  left: `${spotlightRect.left}px`,
                }),
                ...(currentTourStep.position === "left" && {
                  right: `${window.innerWidth - spotlightRect.left + 20}px`,
                  top: `${spotlightRect.top}px`,
                }),
                ...(currentTourStep.position === "right" && {
                  left: `${spotlightRect.right + 20}px`,
                  top: `${spotlightRect.top}px`,
                }),
              } as any)
            : {}
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">
                Bước {currentStep + 1} / {TOUR_STEPS.length}
              </div>
              <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2" onClick={skipTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed">{currentTourStep.description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <Button variant="ghost" size="sm" onClick={prevStep} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
          <Button size="sm" onClick={currentStep === TOUR_STEPS.length - 1 ? completeTour : nextStep}>
            {currentStep === TOUR_STEPS.length - 1 ? (
              "Hoàn tất"
            ) : (
              <>
                Tiếp theo
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
