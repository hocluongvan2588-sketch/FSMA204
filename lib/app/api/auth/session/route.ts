import { NextResponse } from "next/server"
import { getSession } from "@/lib/simple-auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: session })
  } catch (error: any) {
    console.error("[v0] Session error:", error)
    return NextResponse.json({ user: null })
  }
}
