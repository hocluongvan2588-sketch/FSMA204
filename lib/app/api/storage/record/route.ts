import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const record = await request.json()

    if (!record.company_id || !record.file_type || !record.file_name || !record.file_size_bytes) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("file_uploads").insert({
      company_id: record.company_id,
      file_type: record.file_type,
      file_name: record.file_name,
      file_size_bytes: record.file_size_bytes,
      file_url: record.file_url || null,
      uploaded_by: record.uploaded_by || null,
    })

    if (error) {
      console.error("[v0] Error recording file upload:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] File record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
