import { globalSearch } from "@/lib/utils/search"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    if (query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results = await globalSearch(query)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
