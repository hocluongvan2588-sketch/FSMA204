"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TraceabilitySearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/dashboard/traceability/${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Nhập mã TLC để tra cứu (ví dụ: TLC-2024-001)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
        <svg
          className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <Button type="submit" size="lg" className="px-8">
        Tra cứu
      </Button>
    </form>
  )
}
