import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: subscriptions, error } = await supabase
      .from("company_subscriptions")
      .select(`
        *,
        companies (name),
        service_packages (name, price_per_month)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Check if company already has an active subscription
    const { data: existing } = await supabase
      .from("company_subscriptions")
      .select("*")
      .eq("company_id", body.company_id)
      .eq("subscription_status", "active")
      .single()

    if (existing) {
      return NextResponse.json({ error: "Company already has an active subscription" }, { status: 400 })
    }

    const { data: subscription, error } = await supabase
      .from("company_subscriptions")
      .insert([body])
      .select(`
        *,
        companies (name),
        service_packages (name, price_per_month)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
