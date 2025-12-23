"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`${baseUrl}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-600">
        Trang {currentPage} / {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className="bg-transparent"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-transparent"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="bg-transparent"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
