# Vietnamese Payment Gateway Integration Guide

## Overview

Vexim FSMA 204 supports multiple payment gateways for Vietnamese customers:

- **Stripe**: International credit/debit cards (Visa, Mastercard, Amex)
- **VNPay**: Vietnam's leading payment gateway (recommended for VN customers)
- **Momo**: Popular e-wallet with 40M+ users
- **ZaloPay**: Zalo-integrated payment

## Setup Instructions

### 1. Stripe (Already configured)

Already set up. See `STRIPE_SECRET_KEY` in env vars.

### 2. VNPay Setup

**Step 1: Register for VNPay merchant account**

- Go to: https://vnpay.vn/dang-ky-merchant
- Fill in business information
- Wait for approval (2-3 business days)

**Step 2: Get API credentials**

After approval, you'll receive:

- `vnp_TmnCode`: Merchant terminal code
- `vnp_HashSecret`: Secret key for hash validation

**Step 3: Add to environment variables**

\`\`\`env
# VNPay Configuration
VNPAY_TMN_CODE=your_tmn_code_here
VNPAY_HASH_SECRET=your_hash_secret_here
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  # Sandbox
# VNPAY_URL=https://pay.vnpay.vn/vpcpay.html  # Production
\`\`\`

**Step 4: Test with sandbox**

- Use VNPay sandbox: https://sandbox.vnpayment.vn
- Test cards: See VNPay documentation

### 3. Momo Setup

**Step 1: Register for Momo Business**

- Go to: https://business.momo.vn
- Register business account
- Submit documents for verification

**Step 2: Get API credentials**

You'll receive:

- `partnerCode`: Partner code
- `accessKey`: Access key
- `secretKey`: Secret key for signature

**Step 3: Add to environment variables**

\`\`\`env
# Momo Configuration
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn  # Sandbox
# MOMO_ENDPOINT=https://payment.momo.vn  # Production
\`\`\`

### 4. ZaloPay Setup

**Step 1: Register**

- Go to: https://docs.zalopay.vn
- Contact sales team for merchant account

**Step 2: Get credentials**

- `appId`: Application ID
- `key1`, `key2`: Keys for signature

**Step 3: Add to environment variables**

\`\`\`env
# ZaloPay Configuration
ZALOPAY_APP_ID=your_app_id
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn  # Sandbox
# ZALOPAY_ENDPOINT=https://openapi.zalopay.vn  # Production
\`\`\`

## Fee Comparison

| Gateway | Transaction Fee | Settlement Time | Popularity    |
| ------- | --------------- | --------------- | ------------- |
| Stripe  | 2.9% + $0.30    | T+7 days        | International |
| VNPay   | 1.5% - 2%       | T+1 day         | ⭐⭐⭐⭐⭐     |
| Momo    | 1.5% - 2%       | T+1 day         | ⭐⭐⭐⭐⭐     |
| ZaloPay | 1.5% - 2%       | T+1 day         | ⭐⭐⭐⭐      |

## Implementation Status

- [x] Stripe (Completed)
- [x] VNPay (API ready, needs credentials)
- [ ] Momo (API pending)
- [ ] ZaloPay (API pending)

## Recommendation

For Vietnamese customers, we recommend **VNPay** as the primary payment gateway:

- Lowest transaction fees (1.5%)
- Fastest settlement (T+1)
- Supports all major Vietnamese banks
- QR code payment support
- Most widely accepted in Vietnam

For international customers, **Stripe** remains the best option.

## Next Steps

1. Complete VNPay merchant registration
2. Add VNPay credentials to env vars
3. Test VNPay integration in sandbox
4. Enable VNPay in production
5. Consider adding Momo/ZaloPay later based on demand
