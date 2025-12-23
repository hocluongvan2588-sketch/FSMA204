"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/lib/utils/search"
import { FileText, Building2, Package, Truck, ClipboardCheck, Search, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const typeIcons = {
  product: Package,
  facility: Building2,
  lot: ClipboardCheck,
  shipment: Truck,
  report: FileText,
}

const typeLabels = {
  product: "Sản phẩm",
  facility: "Cơ sở",
  lot: "Lô hàng",
  shipment: "Xuất hàng",
  report: "Báo cáo",
}

const typeColors = {
  product: "bg-blue-100 text-blue-700",
  facility: "bg-green-100 text-green-700",
  lot: "bg-purple-100 text-purple-700",
  shipment: "bg-orange-100 text-orange-700",
  report: "bg-slate-100 text-slate-700",
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const searchDebounced = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchDebounced)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full md:w-72 justify-start text-slate-500 font-normal bg-transparent">
          <Search className="h-4 w-4 mr-2" />
          <span>Tìm kiếm...</span>
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 mr-2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm sản phẩm, cơ sở, lô hàng..."
            className="border-0 shadow-none focus-visible:ring-0 h-11"
            autoFocus
          />
          {query && (
            <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((result) => {
                const Icon = typeIcons[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className={cn("p-2 rounded-md shrink-0", typeColors[result.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {typeLabels[result.type]}
                        </Badge>
                      </div>
                      {result.subtitle && <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>}
                      {result.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{result.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center text-sm text-slate-500">Không tìm thấy kết quả</div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">Nhập ít nhất 2 ký tự để tìm kiếm</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
