import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail, logEmailNotification } from "@/lib/email/send"
import { FDAExpiryEmail } from "@/lib/email/templates/fda-expiry"
import { EMAIL_SUBJECTS, EMAIL_CONFIG } from "@/lib/email/config"

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Add to vercel.json: { "crons": [{ "path": "/api/cron/send-notifications", "schedule": "0 9 * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date()
  const results = {
    fdaExpiry: 0,
    agentExpiry: 0,
    subscriptionExpiry: 0,
    errors: [] as string[],
  }

  try {
    // 1. Check FDA registrations expiring soon
    const { data: expiringFDAs } = await supabase
      .from("fda_registrations")
      .select(`
        id,
        fda_registration_number,
        expiry_date,
        notification_enabled,
        notification_days_before,
        contact_email,
        facilities (
          name,
          companies (
            name
          )
        )
      `)
      .eq("notification_enabled", true)
      .eq("registration_status", "active")
      .not("expiry_date", "is", null)

    for (const fda of expiringFDAs || []) {
      const expiryDate = new Date(fda.expiry_date)
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysRemaining > 0 && daysRemaining <= (fda.notification_days_before || 30)) {
        // Check if already sent notification for this expiry
        const { data: existingNotif } = await supabase
          .from("notification_queue")
          .select("id")
          .eq("reference_id", fda.id)
          .eq("notification_type", "fda_expiry")
          .gte("created_at", new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (existingNotif && existingNotif.length > 0) {
          continue // Already sent in last 7 days
        }

        const emailResult = await sendEmail({
          to: fda.contact_email,
          subject: EMAIL_SUBJECTS.fdaExpiry.vi,
          react: FDAExpiryEmail({
            companyName: fda.facilities?.companies?.name || "Company",
            facilityName: fda.facilities?.name || "Facility",
            fdaNumber: fda.fda_registration_number || "N/A",
            expiryDate: new Date(fda.expiry_date).toLocaleDateString("vi-VN"),
            daysRemaining,
            dashboardUrl: `${EMAIL_CONFIG.baseUrl}/dashboard/fda-registrations`,
            language: "vi",
          }),
        })

        await logEmailNotification(supabase, {
          notificationType: "fda_expiry",
          referenceId: fda.id,
          referenceTable: "fda_registrations",
          recipientEmail: fda.contact_email,
          subject: EMAIL_SUBJECTS.fdaExpiry.vi,
          message: `FDA registration ${fda.fda_registration_number} expiring in ${daysRemaining} days`,
          scheduledFor: today.toISOString(),
          status: emailResult.success ? "sent" : "failed",
          errorMessage: emailResult.error,
        })

        if (emailResult.success) {
          results.fdaExpiry++
        } else {
          results.errors.push(`FDA ${fda.fda_registration_number}: ${emailResult.error}`)
        }
      }
    }

    // TODO: Add similar logic for US Agent expiry and Subscription expiry

    return NextResponse.json({
      success: true,
      timestamp: today.toISOString(),
      results,
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
