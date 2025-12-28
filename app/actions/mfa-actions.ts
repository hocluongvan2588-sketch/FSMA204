"use server"
import { logAdminAction } from "@/lib/utils/admin-audit-logger"

// These can be called from client components to log MFA events

export async function logMFAEnrollment(friendlyName: string, factorId: string) {
  try {
    await logAdminAction({
      action: "2fa_enrolled",
      description: `User initiated 2FA enrollment with ${friendlyName}`,
      severity: "medium",
      metadata: {
        factor_type: "totp",
        friendly_name: friendlyName,
        factor_id: factorId,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to log MFA enrollment:", error)
  }
}

export async function logMFAVerification(factorId: string, success: boolean, error?: string) {
  try {
    if (success) {
      await logAdminAction({
        action: "2fa_verified",
        description: "2FA enrollment successfully verified",
        severity: "medium",
        metadata: {
          factor_id: factorId,
        },
      })
    } else {
      await logAdminAction({
        action: "2fa_failed",
        description: `2FA verification failed: ${error || "Unknown error"}`,
        severity: "high",
        metadata: {
          factor_id: factorId,
          error: error || "Unknown error",
        },
      })
    }
  } catch (err) {
    console.error("[v0] Failed to log MFA verification:", err)
  }
}

export async function logMFAUnenrollment(factorId: string) {
  try {
    await logAdminAction({
      action: "2fa_unenrolled",
      description: "2FA factor removed",
      severity: "high",
      metadata: {
        factor_id: factorId,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to log MFA unenrollment:", error)
  }
}

export async function logMFALoginAttempt(factorId: string, success: boolean, error?: string) {
  try {
    if (success) {
      await logAdminAction({
        action: "2fa_verified",
        description: "2FA login successfully verified",
        severity: "low",
        metadata: {
          factor_id: factorId,
        },
      })
    } else {
      await logAdminAction({
        action: "2fa_failed",
        description: `2FA login verification failed: ${error || "Unknown error"}`,
        severity: "high",
        metadata: {
          factor_id: factorId,
          error: error || "Unknown error",
        },
      })
    }
  } catch (err) {
    console.error("[v0] Failed to log MFA login attempt:", err)
  }
}
