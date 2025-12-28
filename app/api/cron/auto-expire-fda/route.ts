import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split("T")[0]

    // 1. Auto-expire FDA registrations
    const { data: expiredFDA, error: fdaError } = await supabase
      .from("fda_registrations")
      .update({
        registration_status: "expired",
        updated_at: new Date().toISOString(),
      })
      .lt("expiry_date", today)
      .eq("registration_status", "active")
      .select("id, facility_name, company_id")

    if (fdaError) {
      console.error("[CRON] Error expiring FDA registrations:", fdaError)
    } else {
      console.log(`[CRON] Expired ${expiredFDA?.length || 0} FDA registrations`)

      // Log each expiration to system_logs
      if (expiredFDA && expiredFDA.length > 0) {
        const logs = expiredFDA.map((reg) => ({
          action: "fda_registration_auto_expired",
          entity_type: "fda_registrations",
          entity_id: reg.id,
          details: {
            facility_name: reg.facility_name,
            company_id: reg.company_id,
            reason: "Auto-expired by cron job",
          },
          created_at: new Date().toISOString(),
        }))

        await supabase.from("system_logs").insert(logs)
      }
    }

    // 2. Auto-expire agent assignments
    const { data: expiredAgents, error: agentError } = await supabase
      .from("agent_assignments")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .lt("expiry_date", today)
      .eq("status", "active")
      .select("id, us_agent_id, company_id, fda_registration_id")

    if (agentError) {
      console.error("[CRON] Error expiring agent assignments:", agentError)
    } else {
      console.log(`[CRON] Expired ${expiredAgents?.length || 0} agent assignments`)

      // Log each expiration
      if (expiredAgents && expiredAgents.length > 0) {
        const logs = expiredAgents.map((assignment) => ({
          action: "agent_assignment_auto_expired",
          entity_type: "agent_assignments",
          entity_id: assignment.id,
          details: {
            us_agent_id: assignment.us_agent_id,
            company_id: assignment.company_id,
            fda_registration_id: assignment.fda_registration_id,
            reason: "Auto-expired by cron job",
          },
          created_at: new Date().toISOString(),
        }))

        await supabase.from("system_logs").insert(logs)
      }
    }

    return NextResponse.json({
      success: true,
      expired_fda_count: expiredFDA?.length || 0,
      expired_agent_count: expiredAgents?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[CRON] Auto-expire error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
