"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { translations, type Locale, defaultLocale } from "@/lib/i18n"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split(".")
  let result = obj

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key]
    } else {
      console.warn(`[v0] Translation key not found: ${path}`)
      return path // Return the key itself if not found
    }
  }

  return typeof result === "string" ? result : path
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // Load saved locale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale
    if (saved && (saved === "en" || saved === "vi")) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("locale", newLocale)
  }

  const t = (key: string): string => {
    return getNestedTranslation(translations[locale], key)
  }

  const value = {
    locale,
    setLocale,
    t,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
