"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { checkDuplicates } from "@/lib/utils/data-quality"

interface DuplicateWarningProps {
  table: string
  field: string
  value: string
  excludeId?: string
}

export function DuplicateWarning({ table, field, value, excludeId }: DuplicateWarningProps) {
  const [hasDuplicate, setHasDuplicate] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!value || value.length < 2) {
      setHasDuplicate(false)
      return
    }

    setIsChecking(true)
    const timeoutId = setTimeout(async () => {
      const isDuplicate = await checkDuplicates(table, field, value, excludeId)
      setHasDuplicate(isDuplicate)
      setIsChecking(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [table, field, value, excludeId])

  if (!hasDuplicate && !isChecking) return null

  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-orange-50 border border-orange-200 text-sm">
      <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
      <p className="text-orange-700">
        {isChecking ? "Đang kiểm tra..." : `Giá trị này đã tồn tại. Vui lòng sử dụng ${field} khác.`}
      </p>
    </div>
  )
}
