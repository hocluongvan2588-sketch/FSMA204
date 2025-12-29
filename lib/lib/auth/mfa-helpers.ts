import { createClient } from "@/lib/supabase/client"

export interface MFAEnrollmentResponse {
  success: boolean
  factorId?: string
  qrCode?: string
  secret?: string
  error?: string
}

export interface MFAVerificationResponse {
  success: boolean
  error?: string
}

// Check if user has MFA enabled
export async function checkMFAStatus(): Promise<{
  enabled: boolean
  factors: any[]
  error?: string
}> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { enabled: false, factors: [], error: "Not authenticated" }
    }

    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error) {
      console.error("[v0] Error listing MFA factors:", error)
      return { enabled: false, factors: [], error: error.message }
    }

    const verified = data?.totp?.filter((f) => f.status === "verified") || []

    return {
      enabled: verified.length > 0,
      factors: verified,
    }
  } catch (error: any) {
    console.error("[v0] MFA status check error:", error)
    return { enabled: false, factors: [], error: error.message }
  }
}

// Enroll a new TOTP factor
export async function enrollMFAFactor(friendlyName = "Authenticator"): Promise<MFAEnrollmentResponse> {
  try {
    const supabase = createClient()

    const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    })

    if (enrollError) {
      console.error("[v0] MFA enrollment error:", enrollError)
      return { success: false, error: enrollError.message }
    }

    if (!enrollData) {
      return { success: false, error: "No enrollment data returned" }
    }

    return {
      success: true,
      factorId: enrollData.id,
      qrCode: enrollData.totp.qr_code,
      secret: enrollData.totp.secret,
    }
  } catch (error: any) {
    console.error("[v0] MFA enrollment exception:", error)
    return { success: false, error: error.message }
  }
}

// Verify TOTP code after enrollment
export async function verifyMFAEnrollment(factorId: string, code: string): Promise<MFAVerificationResponse> {
  try {
    const supabase = createClient()

    // Create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })

    if (challengeError) {
      console.error("[v0] MFA challenge error:", challengeError)
      return { success: false, error: challengeError.message }
    }

    if (!challengeData) {
      return { success: false, error: "No challenge data returned" }
    }

    // Verify the code
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    })

    if (verifyError) {
      console.error("[v0] MFA verification error:", verifyError)
      return { success: false, error: verifyError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] MFA verification exception:", error)
    return { success: false, error: error.message }
  }
}

// Unenroll a factor
export async function unenrollMFAFactor(factorId: string): Promise<MFAVerificationResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    })

    if (error) {
      console.error("[v0] MFA unenrollment error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] MFA unenrollment exception:", error)
    return { success: false, error: error.message }
  }
}

// Challenge an existing factor during login
export async function challengeMFAFactor(factorId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    })

    if (error) {
      console.error("[v0] MFA challenge error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, challengeId: data.id }
  } catch (error: any) {
    console.error("[v0] MFA challenge exception:", error)
    return { success: false, error: error.message }
  }
}

// Verify MFA during login
export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string,
): Promise<MFAVerificationResponse> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    })

    if (error) {
      console.error("[v0] MFA login verification error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] MFA login verification exception:", error)
    return { success: false, error: error.message }
  }
}

// Get Authenticator Assurance Level (AAL)
export async function getAuthenticatorAssuranceLevel(): Promise<{
  currentLevel: "aal1" | "aal2" | null
  nextLevel: "aal1" | "aal2" | null
}> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (error) {
      console.error("[v0] Error getting AAL:", error)
      return { currentLevel: null, nextLevel: null }
    }

    return {
      currentLevel: data.currentLevel as "aal1" | "aal2" | null,
      nextLevel: data.nextLevel as "aal1" | "aal2" | null,
    }
  } catch (error: any) {
    console.error("[v0] AAL check exception:", error)
    return { currentLevel: null, nextLevel: null }
  }
}
