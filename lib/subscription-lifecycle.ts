import { createClient } from "@/lib/supabase/server"

export interface SubscriptionStatus {
  id: string
  companyId: string
  status: "trial" | "active" | "past_due" | "cancelled" | "expired" | "free_default"
  trialEndDate: Date | null
  endDate: Date
  packageName: string
}

/**
 * Check and update expired subscriptions
 * This should be run periodically (e.g., daily cron job)
 */
export async function updateExpiredSubscriptions(): Promise<number> {
  const supabase = await createClient()
  const now = new Date()

  const { data: expiredSubs, error: fetchError } = await supabase
    .from("company_subscriptions")
    .select("id, company_id")
    .in("status", ["active", "trial", "past_due"])
    .lt("end_date", now.toISOString())

  if (fetchError || !expiredSubs) {
    console.error("[v0] Error fetching expired subscriptions:", fetchError)
    return 0
  }

  if (expiredSubs.length === 0) {
    return 0
  }

  const { error: updateError } = await supabase
    .from("company_subscriptions")
    .update({ status: "expired" })
    .in(
      "id",
      expiredSubs.map((s) => s.id),
    )

  if (updateError) {
    console.error("[v0] Error updating expired subscriptions:", updateError)
    return 0
  }

  console.log(`[v0] Marked ${expiredSubs.length} subscriptions as expired`)

  // Log audit changes
  for (const sub of expiredSubs) {
    await logSubscriptionChange({
      companyId: sub.company_id,
      action: "expired",
      newStatus: "expired",
    })
  }

  return expiredSubs.length
}

/**
 * Transition trial subscriptions to active when trial ends
 */
export async function transitionTrialsToActive(): Promise<number> {
  const supabase = await createClient()
  const now = new Date()

  const { data: endedTrials, error: fetchError } = await supabase
    .from("company_subscriptions")
    .select("id, company_id, stripe_subscription_id")
    .eq("status", "trial")
    .lt("trial_end_date", now.toISOString())

  if (fetchError || !endedTrials) {
    console.error("[v0] Error fetching ended trials:", fetchError)
    return 0
  }

  if (endedTrials.length === 0) {
    return 0
  }

  // Only transition if they have a Stripe subscription (payment method added)
  const subsWithPayment = endedTrials.filter((s) => s.stripe_subscription_id)

  if (subsWithPayment.length === 0) {
    const { error: expireError } = await supabase
      .from("company_subscriptions")
      .update({ status: "expired" })
      .in(
        "id",
        endedTrials.map((s) => s.id),
      )

    if (expireError) {
      console.error("[v0] Error expiring trials without payment:", expireError)
    }

    // Log audit changes
    for (const trial of endedTrials) {
      await logSubscriptionChange({
        companyId: trial.company_id,
        action: "expired",
        newStatus: "expired",
      })
    }

    return 0
  }

  const { error: updateError } = await supabase
    .from("company_subscriptions")
    .update({ status: "active" })
    .in(
      "id",
      subsWithPayment.map((s) => s.id),
    )

  if (updateError) {
    console.error("[v0] Error transitioning trials to active:", updateError)
    return 0
  }

  console.log(`[v0] Transitioned ${subsWithPayment.length} trials to active`)

  // Log audit changes
  for (const sub of subsWithPayment) {
    await logSubscriptionChange({
      companyId: sub.company_id,
      action: "trial_ended",
      oldStatus: "trial",
      newStatus: "active",
    })
  }

  return subsWithPayment.length
}

/**
 * Get subscription status for a company
 */
export async function getSubscriptionStatus(companyId: string): Promise<SubscriptionStatus | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("company_subscriptions")
    .select(
      `
      id,
      company_id,
      status,
      trial_end_date,
      end_date,
      service_packages!inner (name)
    `,
    )
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    const { data: freeData, error: freeError } = await supabase
      .from("company_subscriptions")
      .select(
        `
        id,
        company_id,
        status,
        trial_end_date,
        end_date,
        service_packages!inner (name)
      `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (freeError || !freeData) {
      return null
    }

    const freePkg = freeData.service_packages as any
    return {
      id: freeData.id,
      companyId: freeData.company_id,
      status: freeData.status as any,
      trialEndDate: freeData.trial_end_date ? new Date(freeData.trial_end_date) : null,
      endDate: new Date(freeData.end_date),
      packageName: freePkg?.name || "Unknown",
    }
  }

  const pkg = data.service_packages as any

  return {
    id: data.id,
    companyId: data.company_id,
    status: data.status as any,
    trialEndDate: data.trial_end_date ? new Date(data.trial_end_date) : null,
    endDate: new Date(data.end_date),
    packageName: pkg?.name || "Unknown",
  }
}

/**
 * Check if company has active subscription (used in middleware/guards)
 */
export async function hasActiveSubscription(companyId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(companyId)
  return (
    status !== null && (status.status === "active" || status.status === "trial" || status.status === "free_default")
  )
}

/**
 * Get days remaining in subscription
 */
export async function getDaysRemaining(companyId: string): Promise<number> {
  const status = await getSubscriptionStatus(companyId)

  if (!status) {
    return 0
  }

  if (status.packageName === "Free") {
    return -1 // -1 means forever free, never expires
  }

  const now = new Date()
  const diffTime = status.endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export async function isExpiringSoon(companyId: string): Promise<boolean> {
  const daysRemaining = await getDaysRemaining(companyId)
  return daysRemaining > 0 && daysRemaining <= 7
}

export interface SubscriptionAuditLog {
  companyId: string
  action: "created" | "updated" | "cancelled" | "expired" | "trial_ended"
  oldStatus?: string
  newStatus: string
  changedBy?: string
  metadata?: Record<string, any>
}

/**
 * Log subscription lifecycle events for audit trail
 */
export async function logSubscriptionChange(log: SubscriptionAuditLog): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("subscription_audit_logs").insert({
    company_id: log.companyId,
    action: log.action,
    old_status: log.oldStatus,
    new_status: log.newStatus,
    changed_by: log.changedBy,
    metadata: log.metadata,
    created_at: new Date().toISOString(),
  })

  if (error) {
    // Don't throw - logging failure shouldn't break the main flow
    console.error("[v0] Error logging subscription change:", error)
  }
}
