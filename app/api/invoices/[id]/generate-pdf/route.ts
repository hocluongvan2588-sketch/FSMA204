import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // Get invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_items(*)
      `,
      )
      .eq("id", invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check permission
    const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

    if (profile?.role !== "system_admin" && profile?.company_id !== invoice.company_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Generate HTML for the invoice
    const invoiceHTML = generateInvoiceHTML(invoice)

    // Upload to Vercel Blob (simpler than generating PDF server-side)
    const blob = await put(`invoices/${invoice.invoice_number}.html`, invoiceHTML, {
      contentType: "text/html",
      access: "public",
    })

    // Update invoice with PDF URL
    await supabase.from("invoices").update({ pdf_url: blob.url }).eq("id", invoiceId)

    return NextResponse.json({
      success: true,
      url: blob.url,
      invoice_number: invoice.invoice_number,
    })
  } catch (error: any) {
    console.error("[v0] Invoice PDF generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any): string {
  const formatCurrency = (amount: number) => {
    if (invoice.currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; background: white; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { color: #10b981; font-size: 28px; font-weight: bold; }
    .company-info { font-size: 12px; color: #555; margin-top: 10px; }
    .invoice-title { font-size: 24px; font-weight: bold; text-align: right; }
    .invoice-meta { font-size: 14px; text-align: right; margin-top: 10px; }
    .bill-to { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .bill-to h3 { margin-top: 0; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { margin-top: 30px; float: right; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .totals-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; }
    .payment-info { background: #d1fae5; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0; margin: 30px 0; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .watermark { text-align: center; margin-top: 30px; padding: 10px; background: linear-gradient(to right, #10b981, #14b8a6); color: white; border-radius: 6px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Vexim Global</div>
      <div style="color: #6b7280; font-size: 13px;">FSMA 204 Compliance Platform</div>
      <div class="company-info">
        <div>Vexim Global Co., Ltd.</div>
        <div>Ho Chi Minh City, Vietnam</div>
        <div>Tax ID: 0123456789</div>
        <div>Email: support@vexim.global</div>
        <div>Phone: +84 123 456 789</div>
      </div>
    </div>
    <div>
      <div class="invoice-title">HÓA ĐƠN / INVOICE</div>
      <div class="invoice-meta">
        <div><strong>Số:</strong> ${invoice.invoice_number}</div>
        <div><strong>Ngày:</strong> ${formatDate(invoice.invoice_date)}</div>
        ${invoice.paid_at ? `<div style="color: #10b981; font-weight: bold; margin-top: 10px;">✓ Đã thanh toán ${formatDate(invoice.paid_at)}</div>` : ""}
      </div>
    </div>
  </div>

  <div class="bill-to">
    <h3>Khách hàng / Bill To</h3>
    <div><strong>${invoice.bill_to_name}</strong></div>
    <div>${invoice.bill_to_email}</div>
    ${invoice.bill_to_address ? `<div>${invoice.bill_to_address}</div>` : ""}
    ${invoice.bill_to_tax_id ? `<div>Mã số thuế: ${invoice.bill_to_tax_id}</div>` : ""}
    ${invoice.bill_to_phone ? `<div>${invoice.bill_to_phone}</div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Mô tả / Description</th>
        <th class="text-center">SL / Qty</th>
        <th class="text-right">Đơn giá / Price</th>
        <th class="text-right">Thành tiền / Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.invoice_items
        .map(
          (item: any) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unit_price)}</td>
          <td class="text-right"><strong>${formatCurrency(item.amount)}</strong></td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Tạm tính / Subtotal:</span>
      <span><strong>${formatCurrency(invoice.subtotal)}</strong></span>
    </div>
    ${
      invoice.tax_rate > 0
        ? `
    <div class="totals-row">
      <span>VAT (${invoice.tax_rate}%):</span>
      <span><strong>${formatCurrency(invoice.tax_amount)}</strong></span>
    </div>
    `
        : ""
    }
    <div class="totals-row totals-total">
      <span>Tổng cộng / Total:</span>
      <span style="color: #10b981;">${formatCurrency(invoice.total_amount)}</span>
    </div>
  </div>

  <div style="clear: both;"></div>

  ${
    invoice.payment_method
      ? `
  <div class="payment-info">
    <div><strong>Phương thức thanh toán:</strong> ${invoice.payment_method.toUpperCase()}</div>
    <div style="margin-top: 5px;"><strong>Trạng thái:</strong> <span style="color: #10b981; font-weight: bold;">${invoice.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</span></div>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Cảm ơn quý khách đã sử dụng dịch vụ của Vexim Global!</p>
    <p>Thank you for choosing Vexim Global!</p>
    <p style="margin-top: 15px;">
      Website: https://vexim.global | Email: support@vexim.global | Phone: +84 123 456 789
    </p>
  </div>

  <div class="watermark">
    Powered by Vexim Global FSMA 204 Platform
  </div>
</body>
</html>
  `
}
