import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { companyId: string } }) {
  try {
    const { companyId } = params
    const supabase = await createClient()

    const { data: subscription, error } = await supabase
      .from("company_subscriptions")
      .select(`
        *,
        service_packages (*)
      `)
      .eq("company_id", companyId)
      .eq("status", "active")
      .single()

    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error fetching company subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
