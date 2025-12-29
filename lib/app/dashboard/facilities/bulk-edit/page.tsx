import { Suspense } from "react"
import { BulkFacilitiesManager } from "./bulk-facilities-manager"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Bulk Manage Facilities | FoodTrace",
  description: "Import, export, and bulk edit facilities",
}

export default function BulkFacilitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Manage Facilities</h1>
        <p className="text-muted-foreground mt-2">
          Import facilities from CSV, export to CSV, or edit multiple facilities at once
        </p>
      </div>

      <Suspense fallback={<BulkFacilitiesLoadingSkeleton />}>
        <BulkFacilitiesManager />
      </Suspense>
    </div>
  )
}

function BulkFacilitiesLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
