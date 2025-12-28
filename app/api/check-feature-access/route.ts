import { createClient } from "@/lib/supabase/server"
import { hasFeatureAccess, type PlanFeatures } from "@/lib/plan-config"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get("companyId")
    const feature = searchParams.get("feature") as keyof PlanFeatures

    if (!companyId || !feature) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const hasAccess = await hasFeatureAccess(companyId, feature)

    return NextResponse.json({ hasAccess })
  } catch (error) {
    console.error("[v0] Error checking feature access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
