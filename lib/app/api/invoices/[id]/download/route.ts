import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // Get invoice
    const { data: invoice, error } = await supabase.from("invoices").select("*").eq("id", invoiceId).single()

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check permission
    const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

    if (profile?.role !== "system_admin" && profile?.company_id !== invoice.company_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // If no PDF URL, generate it first
    if (!invoice.pdf_url) {
      const generateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoiceId}/generate-pdf`,
        {
          method: "POST",
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        },
      )

      const generateData = await generateResponse.json()
      if (generateData.success) {
        invoice.pdf_url = generateData.url
      }
    }

    // Redirect to PDF URL
    if (invoice.pdf_url) {
      return NextResponse.redirect(invoice.pdf_url)
    }

    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  } catch (error: any) {
    console.error("[v0] Invoice download error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
