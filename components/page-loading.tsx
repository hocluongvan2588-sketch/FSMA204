import { Spinner } from "@/components/ui/spinner"

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p className="text-sm text-slate-500">Đang tải...</p>
      </div>
    </div>
  )
}
