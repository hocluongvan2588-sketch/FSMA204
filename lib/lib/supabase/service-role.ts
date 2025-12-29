import { createClient } from "@supabase/supabase-js"

/**
 * Service Role Client - Bypasses RLS for admin operations
 * Use this for:
 * - System admin viewing all users
 * - Company admin viewing company users
 * - Creating/updating/deleting users on behalf of others
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Please configure your environment variables.")
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations require service role key. " +
        "Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.",
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function isServiceRoleConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
