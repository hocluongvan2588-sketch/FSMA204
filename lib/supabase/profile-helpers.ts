import { createClient } from "./server"
import type { User } from "@supabase/supabase-js"

/**
 * Ensures a profile exists for the given user
 * Creates one if it doesn't exist
 * Uses service role to bypass RLS for profile creation
 */
export async function ensureProfileExists(user: User) {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, organization_type, allowed_cte_types")
    .eq("id", user.id)
    .maybeSingle()

  // If profile exists, return it
  if (profile && !profileError) {
    console.log("[v0] Profile found for user:", user.email)
    return { profile, error: null, created: false, invalidSession: false }
  }

  if (profileError && profileError.code === "42P17") {
    console.error("[v0] ========================================")
    console.error("[v0] RLS INFINITE RECURSION DETECTED")
    console.error("[v0] ========================================")
    console.error("[v0] Error:", {
      message: profileError.message,
      code: profileError.code,
      hint: profileError.hint,
    })
    console.error("[v0] ")
    console.error("[v0] SOLUTION: Run the following script in Supabase SQL Editor:")
    console.error("[v0] scripts/016_ultimate_rls_fix.sql")
    console.error("[v0] ")
    console.error("[v0] This will:")
    console.error("[v0] 1. Remove all recursive RLS policies")
    console.error("[v0] 2. Create simple, non-recursive policies")
    console.error("[v0] 3. Allow profile creation to work properly")
    console.error("[v0] ========================================")

    return {
      profile: null,
      error: profileError,
      created: false,
      invalidSession: false,
    }
  }

  const isNotFoundError =
    !profileError ||
    profileError.code === "PGRST116" ||
    profileError.message?.includes("no rows") ||
    profileError.details?.includes("0 rows") ||
    profileError.message?.includes("not found")

  if (profileError && !isNotFoundError) {
    // For other non-"not found" errors, return the error
    console.error("[v0] Profile fetch error:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
    })
    return { profile: null, error: profileError, created: false, invalidSession: false }
  }

  // We'll use a permissive approach and let the trigger handle it
  console.log("[v0] Profile not found, attempting to create for user:", user.email)

  const newProfile = {
    id: user.id,
    email: user.email, // Required field - fixes NOT NULL constraint
    full_name: user.user_metadata?.full_name || user.email || "User",
    role: user.user_metadata?.role || "viewer",
    language_preference: user.user_metadata?.language_preference || "vi",
    organization_type: user.user_metadata?.organization_type || null,
  }

  console.log("[v0] Attempting to insert profile:", newProfile)

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .maybeSingle()

  if (createError) {
    console.error("[v0] Failed to create profile:", {
      message: createError.message,
      code: createError.code,
      details: createError.details,
      hint: createError.hint,
    })

    if (createError.code === "42P17") {
      console.error("[v0] ========================================")
      console.error("[v0] CRITICAL: RLS infinite recursion prevents profile creation")
      console.error("[v0] ========================================")
      console.error("[v0] Run script: scripts/016_ultimate_rls_fix.sql")
      console.error("[v0] ========================================")
    }

    return { profile: null, error: createError, created: false, invalidSession: false }
  }

  console.log("[v0] Successfully created profile for user:", user.email)
  return { profile: createdProfile, error: null, created: true, invalidSession: false }
}
