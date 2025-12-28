/**
 * Cron endpoint to refresh materialized views
 * Configure in Vercel: https://vercel.com/docs/cron-jobs
 * Schedule: Every 5 minutes
 */

import { MaterializedViewManager } from "@/lib/utils/materialized-view-manager"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // 60 seconds max

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] 🔄 Starting materialized view refresh...")

  const startTime = Date.now()
  const result = await MaterializedViewManager.refreshAll()
  const duration = Date.now() - startTime

  if (result.success) {
    console.log(`[v0] ✅ Views refreshed successfully in ${duration}ms`)
    return NextResponse.json({
      success: true,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    })
  } else {
    console.error(`[v0] ❌ View refresh failed: ${result.error}`)
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        duration_ms: duration,
      },
      { status: 500 },
    )
  }
}
