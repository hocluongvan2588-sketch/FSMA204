"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { fsmaTourSteps } from "@/lib/fsma-tour-steps"
import { cn } from "@/lib/utils"

interface FSMATourProps {
  onComplete?: () => void
  autoStart?: boolean
}

const parseMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\n/g, "<br />")
}

export function FSMATour({ onComplete, autoStart = false }: FSMATourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, transform: "" })
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentTourStep = fsmaTourSteps[currentStep]
  const isLastStep = currentStep === fsmaTourSteps.length - 1
  const isFirstStep = currentStep === 0

  useEffect(() => {
    if (typeof window === "undefined") return
    const hasSeenTour = localStorage.getItem("fsma-tour-completed") === "true"
    const hasSkippedTour = localStorage.getItem("fsma-tour-skipped") === "true"

    if (autoStart && !hasSeenTour && !hasSkippedTour) {
      setTimeout(() => setIsActive(true), 1000)
    }
  }, [autoStart])

  useEffect(() => {
    if (!isActive || !highlightedElement || currentTourStep.target === "body") return

    const updatePositions = () => {
      const tooltipPos = getTooltipPosition()
      setTooltipPosition(tooltipPos)

      const rect = highlightedElement.getBoundingClientRect()
      const padding = currentTourStep.highlightPadding || 8
      const style = window.getComputedStyle(highlightedElement)
      const isFixed = style.position === "fixed"

      const scrollY = isFixed ? 0 : window.scrollY
      const scrollX = isFixed ? 0 : window.scrollX

      setHighlightPosition({
        top: rect.top + scrollY - padding,
        left: rect.left + scrollX - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      })
    }

    if (highlightedElement) {
      updatePositions()
      window.addEventListener("scroll", updatePositions, true)
      window.addEventListener("resize", updatePositions)

      return () => {
        window.removeEventListener("scroll", updatePositions, true)
        window.removeEventListener("resize", updatePositions)
      }
    }
  }, [isActive, highlightedElement, currentTourStep])

  useEffect(() => {
    if (!isActive || !currentTourStep) return

    setIsTransitioning(false)

    if (currentTourStep.target === "body") {
      setHighlightedElement(null)
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transform: "translate(-50%, -50%)",
      })
      return
    }

    const findElementWithRetry = (attempts = 0, maxAttempts = 10) => {
      const element = document.querySelector(currentTourStep.target) as HTMLElement

      if (element) {
        const rect = element.getBoundingClientRect()
        const isVisible = rect.width > 0 && rect.height > 0 && element.offsetParent !== null

        if (isVisible) {
          console.log(`[v0] Tour element found and visible: ${currentTourStep.target}`)
          setHighlightedElement(element)
          const style = window.getComputedStyle(element)
          const isFixed = style.position === "fixed"

          if (!isFixed) {
            const offset = 100
            const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset

            window.scrollTo({
              top: elementPosition,
              behavior: "smooth",
            })

            setTimeout(() => {
              const rect = element.getBoundingClientRect()
              const padding = currentTourStep.highlightPadding || 8
              const scrollY = window.scrollY
              const scrollX = window.scrollX

              setHighlightPosition({
                top: rect.top + scrollY - padding,
                left: rect.left + scrollX - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
              })

              const tooltipPos = getTooltipPosition()
              setTooltipPosition(tooltipPos)
            }, 300)
          }
        } else {
          console.warn(`[v0] Tour target found but not visible: ${currentTourStep.target}`)
          if (attempts < maxAttempts) {
            setTimeout(() => findElementWithRetry(attempts + 1, maxAttempts), 100)
          } else {
            setHighlightedElement(null)
          }
        }
      } else {
        console.warn(`[v0] Tour target not found (attempt ${attempts + 1}/${maxAttempts}): ${currentTourStep.target}`)
        if (attempts < maxAttempts) {
          setTimeout(() => findElementWithRetry(attempts + 1, maxAttempts), 100)
        } else {
          setHighlightedElement(null)
        }
      }
    }

    findElementWithRetry()
  }, [isActive, currentStep, currentTourStep])

  const handleNext = () => {
    if (isTransitioning) return

    if (isLastStep) {
      handleComplete()
    } else {
      setIsTransitioning(true)
      setHighlightedElement(null)

      setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 200)
      }, 150)
    }
  }

  const handlePrevious = () => {
    if (isTransitioning) return

    if (!isFirstStep) {
      setIsTransitioning(true)
      setHighlightedElement(null)

      setTimeout(() => {
        setCurrentStep((prev) => prev - 1)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 200)
      }, 150)
    }
  }

  const handleSkip = () => {
    setIsActive(false)
    setHighlightedElement(null)
    setCurrentStep(0)
    if (typeof window !== "undefined") {
      localStorage.setItem("fsma-tour-skipped", "true")
    }
  }

  const handleComplete = () => {
    setIsActive(false)
    setHighlightedElement(null)
    setCurrentStep(0)

    if (typeof window !== "undefined") {
      localStorage.setItem("fsma-tour-completed", "true")
      localStorage.removeItem("fsma-tour-skipped")
    }

    onComplete?.()
  }

  const categoryColors = {
    setup: "bg-blue-500",
    record: "bg-emerald-500",
    track: "bg-purple-500",
    report: "bg-amber-500",
    comply: "bg-pink-500",
  }

  const categoryLabels = {
    setup: "Thiết lập",
    record: "Ghi nhận",
    track: "Theo dõi",
    report: "Báo cáo",
    comply: "Tuân thủ",
  }

  if (!isActive) {
    const hasCompletedTour = typeof window !== "undefined" && localStorage.getItem("fsma-tour-completed") === "true"

    if (hasCompletedTour) {
      return null
    }

    return (
      <Button
        onClick={() => setIsActive(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-6 left-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all bg-white dark:bg-slate-900"
      >
        <Play className="h-4 w-4 mr-2" />
        Hướng dẫn FSMA 204
      </Button>
    )
  }

  const getTooltipPosition = () => {
    if (!highlightedElement || currentTourStep.target === "body") {
      return {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transform: "translate(-50%, -50%)",
      }
    }

    const rect = highlightedElement.getBoundingClientRect()
    const style = window.getComputedStyle(highlightedElement)
    const isFixed = style.position === "fixed"

    const scrollY = isFixed ? 0 : window.scrollY
    const scrollX = isFixed ? 0 : window.scrollX

    const placement = currentTourStep.placement || "bottom"
    const modalWidth = 420
    const modalHeight = 300
    const gap = 20

    const positions: Record<string, any> = {
      top: {
        top: rect.top + scrollY - gap,
        left: rect.left + scrollX + rect.width / 2,
        transform: "translate(-50%, -100%)",
      },
      bottom: {
        top: rect.bottom + scrollY + gap,
        left: rect.left + scrollX + rect.width / 2,
        transform: "translate(-50%, 0)",
      },
      left: {
        top: rect.top + scrollY + rect.height / 2,
        left: rect.left + scrollX - gap,
        transform: "translate(-100%, -50%)",
      },
      right: {
        top: rect.top + scrollY + rect.height / 2,
        left: rect.right + scrollX + gap,
        transform: "translate(0, -50%)",
      },
      center: {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transform: "translate(-50%, -50%)",
      },
    }

    const position = positions[placement]

    if (position.left + modalWidth / 2 > window.innerWidth) {
      position.left = window.innerWidth - modalWidth - 20
      position.transform = "translate(0, -50%)"
    }
    if (position.left - modalWidth / 2 < 0) {
      position.left = 20
      position.transform = "translate(0, -50%)"
    }

    if (position.top + modalHeight > window.innerHeight + scrollY) {
      position.top = rect.top + scrollY - modalHeight - gap
      position.transform = position.transform.replace("-50%", "-50%").replace("0", "-100%")
    }

    return position
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] pointer-events-none" />

      {!isTransitioning && highlightedElement && currentTourStep.target !== "body" && (
        <div
          className="absolute z-[101] pointer-events-none rounded-2xl ring-4 ring-emerald-500 ring-opacity-70 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
          style={{
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left}px`,
            width: `${highlightPosition.width}px`,
            height: `${highlightPosition.height}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
          }}
        />
      )}

      <Card
        className="fixed z-[102] w-[420px] max-w-[calc(100vw-2rem)] shadow-2xl border-2 border-emerald-500/20 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: tooltipPosition.transform,
        }}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-white", categoryColors[currentTourStep.category])}>
                  {categoryLabels[currentTourStep.category]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Bước {currentStep + 1}/{fsmaTourSteps.length}
                </span>
              </div>
              <h3 className="font-bold text-lg text-foreground leading-tight">{currentTourStep.title}</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div
            className="text-sm text-muted-foreground mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(currentTourStep.content) }}
          />

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / fsmaTourSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              className="text-xs bg-transparent"
              disabled={isTransitioning}
            >
              Bỏ qua
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={isFirstStep || isTransitioning}
                className="text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs"
                disabled={isTransitioning}
              >
                {isLastStep ? "Hoàn thành" : "Tiếp theo"}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
