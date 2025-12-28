import { createClient } from "@/lib/supabase/server"

export interface FDAAuditLog {
  action: string
  entity_type: "fda_registrations" | "agent_assignments" | "us_agents"
  entity_id: string
  user_id?: string
  details: Record<string, any>
  severity?: "info" | "warning" | "error" | "critical"
  ip_address?: string
}

export async function logFDAAction(log: FDAAuditLog) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const logEntry = {
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      user_id: log.user_id || user?.id || null,
      details: log.details,
      severity: log.severity || "info",
      ip_address: log.ip_address || null,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("system_logs").insert(logEntry)

    if (error) {
      console.error("[FDA Audit] Failed to log action:", error)
    } else {
      console.log(`[FDA Audit] Logged action: ${log.action}`)
    }
  } catch (error) {
    console.error("[FDA Audit] Error logging action:", error)
  }
}

// Specific audit logging functions

export async function logFDARegistrationCreated(registrationId: string, details: Record<string, any>) {
  await logFDAAction({
    action: "fda_registration_created",
    entity_type: "fda_registrations",
    entity_id: registrationId,
    details: {
      ...details,
      message: "New FDA registration created",
    },
    severity: "info",
  })
}

export async function logFDARegistrationUpdated(
  registrationId: string,
  changes: Record<string, any>,
  previousValues?: Record<string, any>,
) {
  await logFDAAction({
    action: "fda_registration_updated",
    entity_type: "fda_registrations",
    entity_id: registrationId,
    details: {
      changes,
      previous_values: previousValues,
      message: "FDA registration updated",
    },
    severity: "info",
  })
}

export async function logFDARegistrationDeleted(registrationId: string, details: Record<string, any>) {
  await logFDAAction({
    action: "fda_registration_deleted",
    entity_type: "fda_registrations",
    entity_id: registrationId,
    details: {
      ...details,
      message: "FDA registration deleted",
    },
    severity: "warning",
  })
}

export async function logAgentAssignmentCreated(assignmentId: string, details: Record<string, any>) {
  await logFDAAction({
    action: "agent_assignment_created",
    entity_type: "agent_assignments",
    entity_id: assignmentId,
    details: {
      ...details,
      message: "US Agent assignment created",
    },
    severity: "info",
  })
}

export async function logAgentAssignmentCancelled(assignmentId: string, details: Record<string, any>) {
  await logFDAAction({
    action: "agent_assignment_cancelled",
    entity_type: "agent_assignments",
    entity_id: assignmentId,
    details: {
      ...details,
      message: "US Agent assignment cancelled",
    },
    severity: "warning",
  })
}

export async function logUSAgentCreated(agentId: string, details: Record<string, any>) {
  await logFDAAction({
    action: "us_agent_created",
    entity_type: "us_agents",
    entity_id: agentId,
    details: {
      ...details,
      message: "US Agent created",
    },
    severity: "info",
  })
}

export async function logUSAgentUpdated(agentId: string, changes: Record<string, any>) {
  await logFDAAction({
    action: "us_agent_updated",
    entity_type: "us_agents",
    entity_id: agentId,
    details: {
      changes,
      message: "US Agent information updated",
    },
    severity: "info",
  })
}

export async function logUSAgentDeleted(agentId: string, details: Record<string, any>) {
  await logFDAAction({
    action: "us_agent_deleted",
    entity_type: "us_agents",
    entity_id: agentId,
    details: {
      ...details,
      message: "US Agent deleted",
    },
    severity: "warning",
  })
}
