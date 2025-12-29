import type React from "react"
// Base email template with Vexim Global branding

interface EmailBaseProps {
  children: React.ReactNode
  previewText?: string
}

export function EmailBase({ children, previewText }: EmailBaseProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {previewText && <meta name="description" content={previewText} />}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f3f4f6",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: "#f3f4f6", padding: "40px 0" }}>
          <tr>
            <td align="center">
              {/* Header with Vexim Global branding */}
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <tr>
                  <td
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      padding: "32px",
                      textAlign: "center",
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "24px",
                        fontWeight: "700",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      Vexim Global
                    </h1>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        color: "#ffffff",
                        fontSize: "14px",
                        opacity: 0.9,
                      }}
                    >
                      FSMA 204 Compliance System
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: "32px" }}>{children}</td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      padding: "24px 32px",
                      backgroundColor: "#f9fafb",
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        color: "#6b7280",
                        fontSize: "12px",
                      }}
                    >
                      © 2025 Vexim Global. All rights reserved.
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Powered by <strong>Vexim</strong> FSMA 204 Traceability System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
