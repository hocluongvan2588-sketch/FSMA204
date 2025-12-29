import { Suspense } from "react"
import { BulkProductsManager } from "./bulk-products-manager"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Bulk Manage Products | FoodTrace",
  description: "Import, export, and bulk edit products",
}

export default function BulkProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Manage Products</h1>
        <p className="text-muted-foreground mt-2">
          Import products from CSV, export to CSV, or edit multiple products at once
        </p>
      </div>

      <Suspense fallback={<BulkProductsLoadingSkeleton />}>
        <BulkProductsManager />
      </Suspense>
    </div>
  )
}

function BulkProductsLoadingSkeleton() {
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
