import type React from "react"
import { Resend } from "resend"
import { EMAIL_CONFIG } from "./config"

let resendClient: Resend | null = null

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set")
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  react: React.ReactElement
  replyTo?: string
}

export async function sendEmail({ to, subject, react, replyTo }: SendEmailParams) {
  try {
    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo: replyTo || EMAIL_CONFIG.replyTo,
    })

    if (error) {
      console.error("[v0] Email send error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Email sent successfully:", data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error("[v0] Email send exception:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Helper function to log email to notification_queue
export async function logEmailNotification(
  supabase: any,
  {
    notificationType,
    referenceId,
    referenceTable,
    recipientEmail,
    subject,
    message,
    scheduledFor,
    status = "sent",
    sentAt = new Date().toISOString(),
    errorMessage,
  }: {
    notificationType: string
    referenceId: string
    referenceTable: string
    recipientEmail: string
    subject: string
    message: string
    scheduledFor: string
    status?: "pending" | "sent" | "failed"
    sentAt?: string
    errorMessage?: string
  },
) {
  const { error } = await supabase.from("notification_queue").insert({
    notification_type: notificationType,
    reference_id: referenceId,
    reference_table: referenceTable,
    recipient_email: recipientEmail,
    subject,
    message,
    status,
    scheduled_for: scheduledFor,
    sent_at: sentAt,
    error_message: errorMessage,
  })

  if (error) {
    console.error("[v0] Failed to log email notification:", error)
  }
}
