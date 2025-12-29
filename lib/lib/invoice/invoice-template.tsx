interface InvoiceData {
  invoice_number: string
  invoice_date: string
  bill_to_name: string
  bill_to_email: string
  bill_to_address?: string
  bill_to_tax_id?: string
  bill_to_phone?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  payment_status: string
  paid_at?: string
  payment_method?: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
}

export function InvoiceTemplate({ data }: { data: InvoiceData }) {
  const formatCurrency = (amount: number) => {
    if (data.currency === "VND") {
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

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
      {/* Header with Vexim Global Branding */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-emerald-600">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600 mb-2">Vexim Global</h1>
          <p className="text-sm text-gray-600">FSMA 204 Compliance Platform</p>
          <div className="mt-3 text-sm text-gray-700">
            <p>Vexim Global Co., Ltd.</p>
            <p>Ho Chi Minh City, Vietnam</p>
            <p>Tax ID: 0123456789</p>
            <p>Email: support@vexim.global</p>
            <p>Phone: +84 123 456 789</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">HÓA ĐƠN / INVOICE</h2>
          <div className="text-sm">
            <p className="font-semibold">Số: {data.invoice_number}</p>
            <p className="text-gray-600">Ngày: {formatDate(data.invoice_date)}</p>
            {data.paid_at && (
              <p className="text-emerald-600 font-semibold mt-2">✓ Đã thanh toán {formatDate(data.paid_at)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Khách hàng / Bill To</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-gray-900">{data.bill_to_name}</p>
          <p className="text-sm text-gray-700">{data.bill_to_email}</p>
          {data.bill_to_address && <p className="text-sm text-gray-700">{data.bill_to_address}</p>}
          {data.bill_to_tax_id && <p className="text-sm text-gray-700">Mã số thuế: {data.bill_to_tax_id}</p>}
          {data.bill_to_phone && <p className="text-sm text-gray-700">{data.bill_to_phone}</p>}
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Mô tả / Description</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">SL / Qty</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Đơn giá / Price</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Thành tiền / Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-2">{item.description}</td>
                <td className="py-3 px-2 text-center">{item.quantity}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-3 px-2 text-right font-semibold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Tạm tính / Subtotal:</span>
            <span className="font-semibold">{formatCurrency(data.subtotal)}</span>
          </div>
          {data.tax_rate > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">VAT ({data.tax_rate}%):</span>
              <span className="font-semibold">{formatCurrency(data.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-300">
            <span className="text-lg font-bold text-gray-900">Tổng cộng / Total:</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(data.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {data.payment_method && (
        <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm">
            <span className="font-semibold text-gray-700">Phương thức thanh toán:</span>{" "}
            <span className="text-gray-900">{data.payment_method.toUpperCase()}</span>
          </p>
          <p className="text-sm mt-1">
            <span className="font-semibold text-gray-700">Trạng thái:</span>{" "}
            <span className="text-emerald-600 font-semibold">
              {data.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
            </span>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
        <p className="mb-2">Cảm ơn quý khách đã sử dụng dịch vụ của Vexim Global!</p>
        <p>Thank you for choosing Vexim Global!</p>
        <p className="mt-3 text-xs">
          Website: https://vexim.global | Email: support@vexim.global | Phone: +84 123 456 789
        </p>
      </div>

      {/* Watermark */}
      <div className="mt-8 text-center">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded">
          Powered by Vexim Global FSMA 204 Platform
        </div>
      </div>
    </div>
  )
}
