import { EmailBase } from "./base"

interface FDAExpiryEmailProps {
  companyName: string
  facilityName: string
  fdaNumber: string
  expiryDate: string
  daysRemaining: number
  dashboardUrl: string
  language?: "vi" | "en"
}

export function FDAExpiryEmail({
  companyName,
  facilityName,
  fdaNumber,
  expiryDate,
  daysRemaining,
  dashboardUrl,
  language = "vi",
}: FDAExpiryEmailProps) {
  const content =
    language === "vi"
      ? {
          greeting: `Kính gửi ${companyName},`,
          title: "Cảnh báo: Đăng ký FDA sắp hết hạn",
          message: `Đăng ký FDA của cơ sở <strong>${facilityName}</strong> (số ${fdaNumber}) sẽ hết hạn trong <strong style="color: #dc2626;">${daysRemaining} ngày</strong>.`,
          expiryLabel: "Ngày hết hạn:",
          action:
            "Vexim Global sẽ hỗ trợ gia hạn đăng ký FDA cho bạn. Vui lòng truy cập dashboard để xem chi tiết và cập nhật thông tin.",
          button: "Xem chi tiết đăng ký FDA",
          help: "Cần hỗ trợ? Liên hệ support@vexim.global hoặc hotline: 1900-xxxx",
        }
      : {
          greeting: `Dear ${companyName},`,
          title: "Alert: FDA Registration Expiring Soon",
          message: `The FDA registration for facility <strong>${facilityName}</strong> (registration ${fdaNumber}) will expire in <strong style="color: #dc2626;">${daysRemaining} days</strong>.`,
          expiryLabel: "Expiry Date:",
          action:
            "Vexim Global will assist with your FDA registration renewal. Please visit your dashboard to review details and update information.",
          button: "View FDA Registration Details",
          help: "Need help? Contact support@vexim.global or hotline: 1900-xxxx",
        }

  return (
    <EmailBase previewText={content.title}>
      <p style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "16px" }}>{content.greeting}</p>

      <h2
        style={{
          margin: "0 0 16px 0",
          color: "#dc2626",
          fontSize: "20px",
          fontWeight: "600",
        }}
      >
        {content.title}
      </h2>

      <p
        style={{
          margin: "0 0 24px 0",
          color: "#374151",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
        dangerouslySetInnerHTML={{ __html: content.message }}
      />

      <table
        cellPadding="12"
        cellSpacing="0"
        style={{
          width: "100%",
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <tr>
          <td
            style={{
              color: "#991b1b",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {content.expiryLabel}
          </td>
          <td
            style={{
              color: "#991b1b",
              fontSize: "14px",
              fontWeight: "700",
              textAlign: "right",
            }}
          >
            {expiryDate}
          </td>
        </tr>
      </table>

      <p
        style={{
          margin: "0 0 24px 0",
          color: "#374151",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        {content.action}
      </p>

      <table cellPadding="0" cellSpacing="0" style={{ margin: "0 0 24px 0" }}>
        <tr>
          <td style={{ borderRadius: "8px", backgroundColor: "#10b981" }}>
            <a
              href={dashboardUrl}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              {content.button}
            </a>
          </td>
        </tr>
      </table>

      <p
        style={{
          margin: 0,
          color: "#6b7280",
          fontSize: "12px",
          lineHeight: "1.5",
        }}
      >
        {content.help}
      </p>
    </EmailBase>
  )
}
