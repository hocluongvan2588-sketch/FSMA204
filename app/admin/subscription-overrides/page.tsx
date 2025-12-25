import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"

export const metadata = {
  title: "Quản lý Override | Admin",
  description: "Quản lý override quotas và features cho từng công ty",
}

export default async function SubscriptionOverridesPage() {
  const supabase = await createClient()

  const { data: overrides } = await supabase
    .from("company_subscription_overrides")
    .select("*, companies(company_name), profiles(full_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Overrides</h1>
          <p className="text-muted-foreground">Override quotas và features cho từng công ty cụ thể</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Override Mới
        </Button>
      </div>

      {overrides && overrides.length > 0 ? (
        <div className="grid gap-4">
          {overrides.map((override: any) => (
            <Card key={override.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{override.companies?.company_name}</CardTitle>
                    <CardDescription>
                      Created by {override.profiles?.full_name} • {new Date(override.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={override.is_active ? "default" : "secondary"}>
                      {override.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {override.expires_at && (
                      <Badge variant="outline">Expires: {new Date(override.expires_at).toLocaleDateString()}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {override.overridden_limits && (
                  <div>
                    <h4 className="font-semibold mb-2">Overridden Limits:</h4>
                    <pre className="bg-muted p-2 rounded text-xs">
                      {JSON.stringify(override.overridden_limits, null, 2)}
                    </pre>
                  </div>
                )}
                {override.overridden_features && (
                  <div>
                    <h4 className="font-semibold mb-2">Overridden Features:</h4>
                    <pre className="bg-muted p-2 rounded text-xs">
                      {JSON.stringify(override.overridden_features, null, 2)}
                    </pre>
                  </div>
                )}
                {override.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes:</h4>
                    <p className="text-sm text-muted-foreground">{override.notes}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chưa có override nào được tạo.</p>
        </Card>
      )}
    </div>
  )
}
