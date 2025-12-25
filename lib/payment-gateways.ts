/**
 * Vietnamese Payment Gateway Integration
 * Supports: VNPay, Momo, ZaloPay alongside Stripe
 */

export type PaymentGateway = "stripe" | "vnpay" | "momo" | "zalopay"

export interface PaymentGatewayConfig {
  name: string
  displayName: string
  displayNameVi: string
  enabled: boolean
  supportedCurrencies: string[]
  transactionFee: number // Percentage
  logo: string
  recommended?: boolean
}

export const PAYMENT_GATEWAYS: Record<PaymentGateway, PaymentGatewayConfig> = {
  stripe: {
    name: "stripe",
    displayName: "Credit/Debit Card",
    displayNameVi: "Thẻ tín dụng/ghi nợ",
    enabled: true,
    supportedCurrencies: ["USD", "VND"],
    transactionFee: 2.9,
    logo: "/logos/stripe.svg",
  },
  vnpay: {
    name: "vnpay",
    displayName: "VNPay",
    displayNameVi: "VNPay",
    enabled: true,
    supportedCurrencies: ["VND"],
    transactionFee: 1.5,
    logo: "/logos/vnpay.svg",
    recommended: true, // Recommended for Vietnamese customers
  },
  momo: {
    name: "momo",
    displayName: "Momo E-Wallet",
    displayNameVi: "Ví điện tử Momo",
    enabled: true,
    supportedCurrencies: ["VND"],
    transactionFee: 1.5,
    logo: "/logos/momo.svg",
    recommended: true,
  },
  zalopay: {
    name: "zalopay",
    displayName: "ZaloPay",
    displayNameVi: "ZaloPay",
    enabled: true,
    supportedCurrencies: ["VND"],
    transactionFee: 1.5,
    logo: "/logos/zalopay.svg",
  },
}

/**
 * Get available payment gateways for a currency
 */
export function getAvailableGateways(currency: "USD" | "VND" = "USD"): PaymentGateway[] {
  return Object.entries(PAYMENT_GATEWAYS)
    .filter(([_, config]) => config.enabled && config.supportedCurrencies.includes(currency))
    .map(([gateway]) => gateway as PaymentGateway)
}

/**
 * Get recommended payment gateway based on user location/preference
 */
export function getRecommendedGateway(currency: "USD" | "VND" = "USD"): PaymentGateway {
  if (currency === "VND") {
    return "vnpay" // VNPay is most widely accepted in Vietnam
  }
  return "stripe" // Stripe for international
}

/**
 * Convert USD to VND (approximate)
 */
export function convertUSDtoVND(usdAmount: number): number {
  const exchangeRate = 25000 // Approximate, should be fetched from API in production
  return Math.round(usdAmount * exchangeRate)
}

/**
 * Format price display with currency
 */
export function formatPrice(amount: number, currency: "USD" | "VND" = "USD"): string {
  if (currency === "USD") {
    return `$${amount}`
  } else {
    return `${amount.toLocaleString("vi-VN")} ₫`
  }
}
