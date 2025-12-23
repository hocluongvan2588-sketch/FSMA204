"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface FilterConfig {
  key: string
  label: string
  type: "text" | "select" | "date" | "daterange"
  options?: { value: string; label: string }[]
}

interface AdvancedFiltersProps {
  filters: FilterConfig[]
  onApplyFilters: (filters: Record<string, any>) => void
  onClearFilters: () => void
}

export function AdvancedFilters({ filters, onApplyFilters, onClearFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleApply = () => {
    const cleanedFilters = Object.entries(activeFilters).reduce(
      (acc, [key, value]) => {
        if (value && value !== "") {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>,
    )
    onApplyFilters(cleanedFilters)
    setIsOpen(false)
  }

  const handleClear = () => {
    setActiveFilters({})
    onClearFilters()
    setIsOpen(false)
  }

  const activeFilterCount = Object.values(activeFilters).filter((v) => v && v !== "").length

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="bg-white">
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Lọc nâng cao
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2 px-2">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-lg shadow-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Lọc nâng cao</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">{filter.label}</label>
                  {filter.type === "text" && (
                    <Input
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={`Nhập ${filter.label.toLowerCase()}`}
                    />
                  )}
                  {filter.type === "select" && filter.options && (
                    <Select
                      value={activeFilters[filter.key] || ""}
                      onValueChange={(value) => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Chọn ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {filter.type === "date" && (
                    <Input
                      type="date"
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    />
                  )}
                  {filter.type === "daterange" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={activeFilters[`${filter.key}_from`] || ""}
                        onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                        placeholder="Từ"
                      />
                      <Input
                        type="date"
                        value={activeFilters[`${filter.key}_to`] || ""}
                        onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                        placeholder="Đến"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleClear} variant="outline" className="flex-1 bg-transparent">
                Xóa bộ lọc
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Áp dụng
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
