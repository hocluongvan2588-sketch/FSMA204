# HỆ THỐNG EMAIL - VEXIM GLOBAL FSMA 204

## Tổng quan
Hệ thống email tự động gửi thông báo quan trọng đến users khi có sự kiện cần chú ý.

## Cơ sở hạ tầng
- **Email Service**: Resend (transactional email platform)
- **Templates**: React Email components với Vexim Global branding
- **Scheduler**: Vercel Cron (chạy hàng ngày lúc 9:00 AM UTC+7)
- **Logging**: notification_queue table trong Supabase

## Các loại email tự động

### 1. FDA Registration Expiry Alert
**Trigger**: FDA registration sắp hết hạn
**Thời điểm**: 30 ngày trước expiry date (configurable)
**Recipient**: contact_email trong fda_registrations
**Template**: `lib/email/templates/fda-expiry.tsx`

### 2. US Agent Contract Expiry (Coming soon)
**Trigger**: US Agent contract sắp hết hạn
**Thời điểm**: 60 ngày trước
**Recipient**: Company admin email

### 3. Subscription Expiry (Coming soon)
**Trigger**: Gói dịch vụ sắp hết hạn
**Thời điểm**: 7 ngày trước
**Recipient**: Company admin email

### 4. KDE Alert (Coming soon)
**Trigger**: CTE thiếu Key Data Elements
**Thời điểm**: Real-time
**Recipient**: Operator và Manager

## Cấu hình

### Environment Variables
\`\`\`bash
RESEND_API_KEY=re_xxxxx          # Resend API key
CRON_SECRET=your-secret-here      # Bảo vệ cron endpoint
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

### Branding
Tất cả emails sử dụng:
- Header: "Vexim Global FSMA 204 Compliance System"
- Colors: Emerald gradient (#10b981 → #059669)
- Footer: "Powered by Vexim FSMA 204 Traceability System"
- Logo: Vexim Global wordmark

## Cách test

### Local Testing
\`\`\`bash
# Install dependencies
npm install resend

# Test email template
curl http://localhost:3000/api/test-email
\`\`\`

### Production
\`\`\`bash
# Manual trigger cron job
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/send-notifications
\`\`\`

## Monitoring
- Check `notification_queue` table để xem lịch sử emails
- Resend dashboard: https://resend.com/emails
- Vercel cron logs: https://vercel.com/dashboard

## Roadmap
- [ ] Add more email templates (Agent expiry, Subscription, KDE alert)
- [ ] Multi-language support (EN/VI toggle in user settings)
- [ ] Email preferences page (let users control notification frequency)
- [ ] Weekly digest emails
- [ ] SMS notifications for critical alerts
