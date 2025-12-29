import { NextResponse } from "next/server"
import { destroySession } from "@/lib/simple-auth"

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: error.message || "Logout failed" }, { status: 500 })
  }
}
