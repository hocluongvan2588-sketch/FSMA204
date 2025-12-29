import { Suspense } from "react"
import { BulkLotsManager } from "./bulk-lots-manager"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Bulk Create Lots | FoodTrace",
  description: "Create multiple traceability lots at once",
}

export default function BulkLotsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Create Lots</h1>
        <p className="text-muted-foreground mt-2">
          Create multiple traceability lot codes (TLC) at once using CSV import
        </p>
      </div>

      <Suspense fallback={<BulkLotsLoadingSkeleton />}>
        <BulkLotsManager />
      </Suspense>
    </div>
  )
}

function BulkLotsLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}
