"use client"

import { getFSMAKnowledge } from "@/lib/fsma-knowledge-base"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

interface DailyGreetingProps {
  userName?: string
  autoRotate?: boolean
  rotateInterval?: number
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return "Chào buổi sáng"
  } else if (hour >= 12 && hour < 18) {
    return "Chào buổi chiều"
  } else {
    return "Chào buổi tối"
  }
}

function extractFirstName(userName?: string): string {
  if (!userName) return "bạn"

  if (userName.includes("@")) {
    const emailPart = userName.split("@")[0]
    return emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
  }

  const nameParts = userName.trim().split(" ")
  return nameParts[nameParts.length - 1]
}

function parseMarkdownBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <Badge
          key={index}
          variant="secondary"
          className="font-semibold bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 mx-0.5 px-2 py-0.5"
        >
          {content}
        </Badge>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function DailyGreeting({ userName, autoRotate = false, rotateInterval = 30000 }: DailyGreetingProps) {
  const [knowledge, setKnowledge] = useState<ReturnType<typeof getFSMAKnowledge> | null>(null)
  const [greeting, setGreeting] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [rotationCount, setRotationCount] = useState(0)

  useEffect(() => {
    setKnowledge(getFSMAKnowledge())
    setGreeting(getTimeBasedGreeting())
    setCurrentDate(
      new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    )
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !autoRotate) return

    const intervalId = setInterval(() => {
      console.log("[v0] Auto-rotating FSMA knowledge content")
      setKnowledge(getFSMAKnowledge())
      setRotationCount((prev) => prev + 1)
    }, rotateInterval)

    return () => clearInterval(intervalId)
  }, [mounted, autoRotate, rotateInterval])

  if (!mounted || !knowledge) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="h-9 w-64 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded-full"></div>
        </div>
        <div className="mt-4 h-20 bg-muted animate-pulse rounded-2xl"></div>
      </div>
    )
  }

  const displayName = extractFirstName(userName)

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {greeting} <span className="text-emerald-600">{displayName}</span>!
          </h1>
        </div>
        <div className="text-sm text-muted-foreground px-5 py-2.5 rounded-full border border-border bg-background shadow-sm">
          {currentDate}
        </div>
      </div>

      <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-2xl mt-0.5">{knowledge.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {parseMarkdownBold(knowledge.content)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
