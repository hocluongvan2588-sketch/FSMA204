"use client"

import { usePathname } from "next/navigation"
import { FloatingChatbot } from "./floating-chatbot"
import { useEffect, useState } from "react"

export function ChatbotProvider() {
  const pathname = usePathname()
  const [userName, setUserName] = useState<string>()

  useEffect(() => {
    // Fetch user profile from localStorage or API
    const profile = localStorage.getItem("userProfile")
    if (profile) {
      try {
        const parsed = JSON.parse(profile)
        setUserName(parsed.full_name)
      } catch (e) {
        console.error("Failed to parse user profile", e)
      }
    }
  }, [])

  // Hide chatbot on auth pages
  const hideOnPaths = ["/login", "/signup", "/auth", "/onboarding"]
  const shouldHide = hideOnPaths.some((path) => pathname?.startsWith(path))

  if (shouldHide) {
    return null
  }

  return <FloatingChatbot userName={userName} />
}
