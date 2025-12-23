"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { AdvancedFilters } from "@/components/advanced-filters"
import { debounce } from "@/lib/utils"

interface DataTableSearchProps {
  searchPlaceholder?: string
  filterConfigs?: any[]
  onSearch: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
  showAdvancedFilters?: boolean
}

export function DataTableSearch({
  searchPlaceholder = "Tìm kiếm...",
  filterConfigs = [],
  onSearch,
  onFilter,
  showAdvancedFilters = true,
}: DataTableSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query)
    }, 300),
    [onSearch],
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    onSearch("")
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        <svg
          className="absolute left-3 top-3 h-4 w-4 text-slate-400"
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
        {searchQuery && (
          <button onClick={handleClearSearch} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showAdvancedFilters && filterConfigs.length > 0 && onFilter && (
        <AdvancedFilters filters={filterConfigs} onApplyFilters={onFilter} onClearFilters={() => onFilter({})} />
      )}
    </div>
  )
}
