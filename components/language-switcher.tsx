"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-slate-50 p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocale("vi")}
        className={locale === "vi" ? "bg-white shadow-sm" : "hover:bg-transparent"}
      >
        VI
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocale("en")}
        className={locale === "en" ? "bg-white shadow-sm" : "hover:bg-transparent"}
      >
        EN
      </Button>
    </div>
  )
}
