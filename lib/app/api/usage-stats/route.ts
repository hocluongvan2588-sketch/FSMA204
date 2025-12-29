import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Get user to verify access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription with package info
    const { data: subscription, error: subError } = await supabase
      .from("company_subscriptions")
      .select(
        `
        *,
        service_packages!inner (
          name,
          package_code,
          limits
        )
      `,
      )
      .eq("company_id", companyId)
      .in("status", ["active", "trial"])
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      console.error("[v0] Error fetching subscription:", subError)
      return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
    }

    if (!subscription || !subscription.service_packages) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 })
    }

    const pkg = subscription.service_packages as any
    const limits = pkg.limits || {}

    // Get actual counts from database
    const [usersResult, facilitiesResult, productsResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("facilities").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    ])

    const currentUsers = usersResult.count || 0
    const currentFacilities = facilitiesResult.count || 0
    const currentProducts = productsResult.count || 0
    const currentStorage = subscription.current_storage_gb || 0

    const maxUsers = limits.max_users || 1
    const maxFacilities = limits.max_facilities || 1
    const maxProducts = limits.max_products || 3
    const maxStorage = limits.max_storage_gb || 1

    const isUnlimited = maxUsers === -1

    return NextResponse.json({
      users: {
        current: currentUsers,
        limit: maxUsers,
        percentage: isUnlimited ? 0 : Math.min((currentUsers / maxUsers) * 100, 100),
      },
      facilities: {
        current: currentFacilities,
        limit: maxFacilities,
        percentage: isUnlimited ? 0 : Math.min((currentFacilities / maxFacilities) * 100, 100),
      },
      products: {
        current: currentProducts,
        limit: maxProducts,
        percentage: isUnlimited ? 0 : Math.min((currentProducts / maxProducts) * 100, 100),
      },
      storage: {
        current: currentStorage,
        limit: maxStorage,
        percentage: isUnlimited ? 0 : Math.min((currentStorage / maxStorage) * 100, 100),
        unit: "GB",
      },
      packageName: pkg.name,
      isUnlimited,
    })
  } catch (error) {
    console.error("[v0] Error in usage stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
