import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

/**
 * VNPay Payment Creation API
 * Documentation: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { companyId, packageId, billingCycle, amount, currency } = await request.json()

    // Get package details
    const { data: pkg } = await supabase.from("service_packages").select("*").eq("id", packageId).single()

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Calculate amount in VND
    const exchangeRate = 25000 // TODO: Fetch from real-time API
    const usdAmount = billingCycle === "monthly" ? pkg.price_monthly : pkg.price_yearly
    const vndAmount = currency === "VND" ? amount : Math.round(usdAmount * exchangeRate)

    // VNPay configuration
    const vnpTmnCode = process.env.VNPAY_TMN_CODE || "DEMO"
    const vnpHashSecret = process.env.VNPAY_HASH_SECRET || "DEMO_SECRET"
    const vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/vnpay/callback`

    // Create payment request
    const createDate = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)
    const orderId = `VEXIM_${companyId.slice(0, 8)}_${Date.now()}`

    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        company_id: companyId,
        payment_gateway: "vnpay",
        order_id: orderId,
        amount: usdAmount,
        currency: "VND",
        exchange_rate: exchangeRate,
        amount_vnd: vndAmount,
        status: "pending",
        metadata: {
          package_id: packageId,
          package_name: pkg.package_name,
          billing_cycle: billingCycle,
        },
      })
      .select()
      .single()

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }
    // </CHANGE>

    const vnpParams: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpTmnCode,
      vnp_Amount: (vndAmount * 100).toString(), // VNPay uses smallest unit (VND * 100)
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Subscription ${pkg.package_name} - ${billingCycle}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: request.headers.get("x-forwarded-for") || "127.0.0.1",
      vnp_CreateDate: createDate,
    }

    // Sort params alphabetically
    const sortedParams = Object.keys(vnpParams)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(vnpParams[key])}`)
      .join("&")

    // Create secure hash
    const hmac = crypto.createHmac("sha512", vnpHashSecret)
    const secureHash = hmac.update(Buffer.from(sortedParams, "utf-8")).digest("hex")

    const paymentUrl = `${vnpUrl}?${sortedParams}&vnp_SecureHash=${secureHash}`

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId,
      amount: vndAmount,
      transactionId: transaction.id,
    })
  } catch (error: any) {
    console.error("[v0] VNPay payment creation error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
