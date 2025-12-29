import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText, CreditCard, Receipt } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function PaymentHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "system_admin")) {
    redirect("/dashboard")
  }

  // Get payment transactions
  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select(
      `
      *,
      invoices(*)
    `,
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  // Get all invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      `
      *,
      invoice_items(*)
    `,
    )
    .eq("company_id", profile.company_id)
    .order("invoice_date", { ascending: false })

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "VND") {
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Đang xử lý" },
      processing: { variant: "default", label: "Đang thanh toán" },
      completed: { variant: "default", label: "Thành công" },
      failed: { variant: "destructive", label: "Thất bại" },
      refunded: { variant: "outline", label: "Đã hoàn tiền" },
      cancelled: { variant: "outline", label: "Đã hủy" },
      paid: { variant: "default", label: "Đã thanh toán" },
      unpaid: { variant: "destructive", label: "Chưa thanh toán" },
    }
    return statusMap[status] || { variant: "outline", label: status }
  }

  const getPaymentMethodDisplay = (gateway: string, method?: string) => {
    const gatewayMap: Record<string, string> = {
      stripe: "Stripe (Credit Card)",
      vnpay: "VNPay",
      momo: "Momo E-Wallet",
      zalopay: "ZaloPay",
    }
    return method ? `${gatewayMap[gateway]} - ${method}` : gatewayMap[gateway]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lịch sử thanh toán</h1>
          <p className="text-slate-500 mt-1">Xem tất cả giao dịch và hóa đơn của công ty bạn</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/my-subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Gói dịch vụ
          </Link>
        </Button>
      </div>

      {/* Payment Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch thanh toán</CardTitle>
          <CardDescription>Lịch sử tất cả các giao dịch thanh toán của công ty</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{transaction.order_id}</p>
                        <Badge variant={getStatusBadge(transaction.status).variant}>
                          {getStatusBadge(transaction.status).label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {getPaymentMethodDisplay(transaction.payment_gateway, transaction.payment_method)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(transaction.created_at), "dd MMMM yyyy, HH:mm", { locale: vi })}
                      </p>
                      {transaction.metadata?.package_name && (
                        <p className="text-xs text-emerald-600">
                          Gói: {transaction.metadata.package_name} - {transaction.metadata.billing_cycle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(
                        transaction.currency === "VND" ? transaction.amount_vnd : transaction.amount,
                        transaction.currency,
                      )}
                    </p>
                    {transaction.currency === "VND" && transaction.exchange_rate && (
                      <p className="text-xs text-slate-500">
                        ${transaction.amount} (Tỷ giá: {transaction.exchange_rate})
                      </p>
                    )}
                    {transaction.invoices && transaction.invoices.length > 0 && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/api/invoices/${transaction.invoices[0].id}/download`}>
                          <Receipt className="h-4 w-4 mr-2" />
                          Hóa đơn
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Chưa có giao dịch nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Hóa đơn</CardTitle>
          <CardDescription>Tất cả hóa đơn đã phát hành cho công ty bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                        <Badge variant={getStatusBadge(invoice.payment_status).variant}>
                          {getStatusBadge(invoice.payment_status).label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{invoice.bill_to_name}</p>
                      <p className="text-xs text-slate-500">
                        Ngày: {format(new Date(invoice.invoice_date), "dd MMMM yyyy", { locale: vi })}
                      </p>
                      {invoice.paid_at && (
                        <p className="text-xs text-emerald-600">
                          Đã thanh toán: {format(new Date(invoice.paid_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      )}
                      {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                        <p className="text-xs text-slate-500">{invoice.invoice_items[0].description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </p>
                    {invoice.tax_rate > 0 && (
                      <p className="text-xs text-slate-500">
                        (Bao gồm VAT {invoice.tax_rate}%: {formatCurrency(invoice.tax_amount, invoice.currency)})
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/api/invoices/${invoice.id}/download`}>
                          <Download className="h-4 w-4 mr-2" />
                          Tải xuống
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Chưa có hóa đơn nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {transactions && transactions.length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle>Tổng quan thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-slate-600 mb-1">Tổng giao dịch</p>
                <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-slate-600 mb-1">Thành công</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {transactions.filter((t) => t.status === "completed").length}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-slate-600 mb-1">Hóa đơn</p>
                <p className="text-2xl font-bold text-blue-600">{invoices?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
