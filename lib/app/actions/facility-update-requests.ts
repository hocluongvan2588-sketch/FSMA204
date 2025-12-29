"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAdminAction } from "@/lib/utils/admin-audit-logger"

interface SubmitUpdateRequestInput {
  facility_id: string
  requested_changes: Record<string, any>
}

interface ApproveUpdateRequestInput {
  request_id: string
  apply_changes: boolean
}

interface RejectUpdateRequestInput {
  request_id: string
  rejection_note: string
}

export async function submitFacilityUpdateRequest(input: SubmitUpdateRequestInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    // Verify user is company admin and facility belongs to their company
    const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()

    if (!profile || !["admin", "manager"].includes(profile.role)) {
      return { error: "Bạn không có quyền tạo yêu cầu cập nhật" }
    }

    const { data: facility } = await supabase
      .from("facilities")
      .select("company_id")
      .eq("id", input.facility_id)
      .single()

    if (facility?.company_id !== profile.company_id) {
      return { error: "Bạn không có quyền cập nhật cơ sở này" }
    }

    // Create update request
    const { data, error } = await supabase
      .from("facility_update_requests")
      .insert({
        facility_id: input.facility_id,
        requested_by: user.id,
        requested_changes: input.requested_changes,
        request_status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Facility update request creation error:", error)
      return { error: error.message }
    }

    // Log to system_logs
    await supabase.from("system_logs").insert({
      user_id: user.id,
      action: "create_update_request",
      entity_type: "facility_update_request",
      entity_id: data.id,
      description: `Yêu cầu cập nhật cơ sở: ${input.facility_id}`,
      metadata: { facility_id: input.facility_id, changes: input.requested_changes },
    })

    revalidatePath("/dashboard/facilities")
    revalidatePath("/admin/fda-registrations")
    return { success: true, request: data }
  } catch (error: any) {
    console.error("[v0] Submit facility update request error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function approveFacilityUpdateRequest(input: ApproveUpdateRequestInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    // Verify user is system admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "system_admin") {
      return { error: "Chỉ System Admin mới có quyền phê duyệt yêu cầu" }
    }

    // Get the update request
    const { data: request } = await supabase
      .from("facility_update_requests")
      .select("*, facilities(id, name, company_id)")
      .eq("id", input.request_id)
      .single()

    if (!request) {
      return { error: "Không tìm thấy yêu cầu cập nhật" }
    }

    if (request.request_status !== "pending") {
      return { error: "Yêu cầu này đã được xử lý" }
    }

    // Apply changes to facility if requested
    if (input.apply_changes) {
      const { error: updateError } = await supabase
        .from("facilities")
        .update({
          ...request.requested_changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.facility_id)

      if (updateError) {
        console.error("[v0] Facility update error:", updateError)
        return { error: `Lỗi áp dụng thay đổi: ${updateError.message}` }
      }
    }

    // Update request status
    const { error: statusError } = await supabase
      .from("facility_update_requests")
      .update({
        request_status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.request_id)

    if (statusError) {
      console.error("[v0] Request status update error:", statusError)
      return { error: statusError.message }
    }

    await logAdminAction({
      action: "facility_approve",
      targetEntityId: request.facility_id,
      targetCompanyId: request.facilities?.company_id,
      entityType: "facility",
      description: `Approved facility update request for: ${request.facilities?.name || request.facility_id}`,
      metadata: {
        request_id: input.request_id,
        facility_name: request.facilities?.name,
        changes_applied: input.apply_changes,
        requested_changes: request.requested_changes,
        requested_by: request.requested_by,
      },
      changes: input.apply_changes
        ? {
            before: {},
            after: request.requested_changes,
          }
        : undefined,
      severity: "high",
    })

    // Log to system_logs
    await supabase.from("system_logs").insert({
      user_id: user.id,
      action: "approve_update_request",
      entity_type: "facility_update_request",
      entity_id: request.id,
      description: `Phê duyệt yêu cầu cập nhật cơ sở: ${request.facilities?.name}`,
      metadata: { facility_id: request.facility_id, applied: input.apply_changes },
    })

    revalidatePath("/dashboard/facilities")
    revalidatePath("/admin/fda-registrations")
    revalidatePath("/admin/facility-requests")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Approve facility update request error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function rejectFacilityUpdateRequest(input: RejectUpdateRequestInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    // Verify user is system admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "system_admin") {
      return { error: "Chỉ System Admin mới có quyền từ chối yêu cầu" }
    }

    // Get the update request
    const { data: request } = await supabase
      .from("facility_update_requests")
      .select("*, facilities(id, name, company_id)")
      .eq("id", input.request_id)
      .single()

    if (!request) {
      return { error: "Không tìm thấy yêu cầu cập nhật" }
    }

    if (request.request_status !== "pending") {
      return { error: "Yêu cầu này đã được xử lý" }
    }

    // Update request status
    const { error: statusError } = await supabase
      .from("facility_update_requests")
      .update({
        request_status: "rejected",
        rejection_note: input.rejection_note,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.request_id)

    if (statusError) {
      console.error("[v0] Request status update error:", statusError)
      return { error: statusError.message }
    }

    await logAdminAction({
      action: "facility_reject",
      targetEntityId: request.facility_id,
      targetCompanyId: request.facilities?.company_id,
      entityType: "facility",
      description: `Rejected facility update request for: ${request.facilities?.name || request.facility_id}`,
      metadata: {
        request_id: input.request_id,
        facility_name: request.facilities?.name,
        rejection_note: input.rejection_note,
        requested_changes: request.requested_changes,
        requested_by: request.requested_by,
      },
      severity: "medium",
    })

    // Log to system_logs
    await supabase.from("system_logs").insert({
      user_id: user.id,
      action: "reject_update_request",
      entity_type: "facility_update_request",
      entity_id: request.id,
      description: `Từ chối yêu cầu cập nhật cơ sở: ${request.facilities?.name}`,
      metadata: { facility_id: request.facility_id, reason: input.rejection_note },
    })

    revalidatePath("/dashboard/facilities")
    revalidatePath("/admin/fda-registrations")
    revalidatePath("/admin/facility-requests")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Reject facility update request error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function getPendingFacilityUpdateRequests() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "system_admin") {
      return { error: "Chỉ System Admin mới có quyền xem yêu cầu" }
    }

    const { data, error } = await supabase
      .from("facility_update_requests")
      .select(
        `
        *,
        facilities(id, name, location_code, company_id, companies(name)),
        profiles!facility_update_requests_requested_by_fkey(full_name, email)
      `,
      )
      .eq("request_status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Get pending requests error:", error)
      return { error: error.message }
    }

    return { success: true, requests: data }
  } catch (error: any) {
    console.error("[v0] Get pending facility update requests error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
