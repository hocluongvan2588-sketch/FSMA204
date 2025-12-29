import { NextResponse } from "next/server"
import { updateExpiredSubscriptions, transitionTrialsToActive } from "@/lib/subscription-lifecycle"

/**
 * Cron job to update subscription statuses
 * Configure Vercel Cron to call this endpoint daily
 *
 * In vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-subscriptions",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Verify this is being called by Vercel Cron (production only)
  const authHeader = request.headers.get("authorization")
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[v0] Running subscription lifecycle cron job")

    // Transition ended trials to active (if payment method exists)
    const transitioned = await transitionTrialsToActive()
    console.log(`[v0] Transitioned ${transitioned} trials`)

    // Mark expired subscriptions
    const expired = await updateExpiredSubscriptions()
    console.log(`[v0] Expired ${expired} subscriptions`)

    return NextResponse.json({
      success: true,
      transitioned,
      expired,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
