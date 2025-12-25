// Email configuration for the FSMA 204 system
// Uses Resend for transactional emails

export const EMAIL_CONFIG = {
  from: {
    name: "Vexim Global FSMA 204",
    email: "noreply@vexim.global", // Replace with your domain
  },
  replyTo: "support@vexim.global", // Replace with your support email

  // Email templates base URL
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://fsma204.vexim.global",

  // Notification settings
  defaultDaysBefore: {
    fdaExpiry: 30,
    agentExpiry: 60,
    subscriptionExpiry: 7,
    inspectionDue: 14,
  },
}

export const EMAIL_SUBJECTS = {
  fdaExpiry: {
    vi: "[Vexim Global] Cảnh báo: Đăng ký FDA sắp hết hạn",
    en: "[Vexim Global] Alert: FDA Registration Expiring Soon",
  },
  agentExpiry: {
    vi: "[Vexim Global] Cảnh báo: Hợp đồng US Agent sắp hết hạn",
    en: "[Vexim Global] Alert: US Agent Contract Expiring Soon",
  },
  subscriptionExpiry: {
    vi: "[Vexim Global] Thông báo: Gói dịch vụ sắp hết hạn",
    en: "[Vexim Global] Notice: Subscription Expiring Soon",
  },
  inspectionDue: {
    vi: "[Vexim Global] Nhắc nhở: Kiểm tra FDA sắp đến hạn",
    en: "[Vexim Global] Reminder: FDA Inspection Due",
  },
  kdeAlert: {
    vi: "[Vexim Global] Cảnh báo: Thiếu Key Data Elements (KDE)",
    en: "[Vexim Global] Alert: Missing Key Data Elements (KDE)",
  },
}
