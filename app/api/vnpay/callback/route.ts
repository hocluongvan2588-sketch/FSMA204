import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

/**
 * VNPay Payment Callback (IPN)
 * Handles payment confirmation from VNPay
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    // Get VNPay response parameters
    const vnpParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
        vnpParams[key] = value
      }
    })

    const secureHash = searchParams.get("vnp_SecureHash")
    const vnpHashSecret = process.env.VNPAY_HASH_SECRET || "DEMO_SECRET"

    // Verify secure hash
    const sortedParams = Object.keys(vnpParams)
      .sort()
      .map((key) => `${key}=${vnpParams[key]}`)
      .join("&")

    const hmac = crypto.createHmac("sha512", vnpHashSecret)
    const calculatedHash = hmac.update(Buffer.from(sortedParams, "utf-8")).digest("hex")

    if (secureHash !== calculatedHash) {
      console.error("[v0] VNPay secure hash mismatch")
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?error=invalid_hash`)
    }

    // Check transaction status
    const responseCode = searchParams.get("vnp_ResponseCode")
    const orderId = searchParams.get("vnp_TxnRef")
    const vnpTransactionNo = searchParams.get("vnp_TransactionNo")
    const amount = Number.parseInt(searchParams.get("vnp_Amount") || "0") / 100 // Convert back to VND
    const bankCode = searchParams.get("vnp_BankCode")
    const cardType = searchParams.get("vnp_CardType")

    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*, subscriptions(*)")
      .eq("order_id", orderId)
      .single()

    if (!transaction) {
      console.error("[v0] Transaction not found:", orderId)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?error=transaction_not_found`,
      )
    }

    if (responseCode === "00") {
      // Payment successful
      console.log("[v0] VNPay payment successful:", orderId)

      // Update transaction status
      await supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          gateway_transaction_id: vnpTransactionNo,
          payment_method: cardType === "ATM" ? "domestic_card" : cardType,
          completed_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            bank_code: bankCode,
            card_type: cardType,
            vnp_response_code: responseCode,
          },
        })
        .eq("id", transaction.id)

      // Create or update subscription
      const packageId = transaction.metadata.package_id
      const billingCycle = transaction.metadata.billing_cycle

      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("company_id", transaction.company_id)
        .single()

      const startDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

      const endDate = new Date(trialEndDate)
      if (billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      if (existingSubscription) {
        await supabase
          .from("subscriptions")
          .update({
            package_id: packageId,
            subscription_status: "trial",
            billing_cycle: billingCycle,
            start_date: startDate.toISOString(),
            trial_end_date: trialEndDate.toISOString(),
            end_date: endDate.toISOString(),
            last_payment_date: new Date().toISOString(),
            last_payment_amount: transaction.amount,
            payment_method: "vnpay",
          })
          .eq("id", existingSubscription.id)

        // Link transaction to subscription
        await supabase
          .from("payment_transactions")
          .update({ subscription_id: existingSubscription.id })
          .eq("id", transaction.id)
      }

      // Create invoice automatically
      const { data: invoice } = await supabase.rpc("create_invoice_from_transaction", {
        p_transaction_id: transaction.id,
      })

      console.log("[v0] Invoice created:", invoice)

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?success=true&invoice=${invoice}`,
      )
    } else {
      // Payment failed
      console.error("[v0] VNPay payment failed:", responseCode)

      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          error_message: `VNPay error code: ${responseCode}`,
          metadata: {
            ...transaction.metadata,
            vnp_response_code: responseCode,
          },
        })
        .eq("id", transaction.id)

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?error=payment_failed&code=${responseCode}`,
      )
    }
    // </CHANGE>
  } catch (error: any) {
    console.error("[v0] VNPay callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/my-subscription?error=callback_failed`)
  }
}
