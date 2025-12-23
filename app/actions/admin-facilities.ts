"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkFacilityQuota } from "@/lib/quota"
import { incrementFacilityCount, decrementFacilityCount } from "@/lib/usage-tracker"

interface AdminCreateFacilityInput {
  company_id: string
  name: string
  facility_type: string
  location_code: string
  address: string
  gps_coordinates?: string
  certification_status: string
  fda_facility_number?: string
  us_agent_id?: string
  fda_registration_date?: string
  agent_registration_date?: string
  fda_expiry_date?: string
  registration_email?: string
  duns_number?: string
  email?: string
  phone?: string
  fda_registration_status?: string
}

interface AdminUpdateFacilityInput {
  facility_id: string
  name: string
  facility_type: string
  location_code: string
  address: string
  gps_coordinates?: string
  certification_status: string
  fda_facility_number?: string
  us_agent_id?: string
  fda_registration_date?: string
  agent_registration_date?: string
  fda_expiry_date?: string
  registration_email?: string
  duns_number?: string
  email?: string
  phone?: string
  fda_registration_status?: string
}

export async function adminCreateFacility(input: AdminCreateFacilityInput) {
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
      return { error: "Chỉ System Admin mới có quyền thực hiện chức năng này" }
    }

    const quotaCheck = await checkFacilityQuota(input.company_id)

    if (!quotaCheck.allowed) {
      if (quotaCheck.subscriptionStatus === "none") {
        return { error: "Công ty này chưa có gói dịch vụ. Vui lòng đăng ký gói dịch vụ trước." }
      }
      if (quotaCheck.maxAllowed === -1) {
        return { error: "Gói dịch vụ của công ty này không hoạt động." }
      }
      return {
        error: `Công ty này đã đạt giới hạn cơ sở (${quotaCheck.currentUsage}/${quotaCheck.maxAllowed}). Vui lòng nâng cấp gói dịch vụ.`,
      }
    }

    let calculatedExpiryDate = input.fda_expiry_date
    if (input.fda_registration_date && !input.fda_expiry_date) {
      const regDate = new Date(input.fda_registration_date)
      regDate.setFullYear(regDate.getFullYear() + 2)
      calculatedExpiryDate = regDate.toISOString().split("T")[0]
    }

    const { data, error } = await supabase
      .from("facilities")
      .insert({
        company_id: input.company_id,
        name: input.name,
        facility_type: input.facility_type,
        location_code: input.location_code,
        address: input.address,
        gps_coordinates: input.gps_coordinates || null,
        certification_status: input.certification_status,
        fda_facility_number: input.fda_facility_number || null,
        us_agent_id: input.us_agent_id || null,
        fda_registration_date: input.fda_registration_date || null,
        agent_registration_date: input.agent_registration_date || null,
        fda_expiry_date: calculatedExpiryDate || null,
        registration_email: input.registration_email || null,
        duns_number: input.duns_number || null,
        email: input.email || null,
        phone: input.phone || null,
        fda_registration_status: input.fda_registration_status || "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Admin facility creation error:", error)
      return { error: error.message }
    }

    await incrementFacilityCount(input.company_id)

    revalidatePath("/admin/facilities")
    revalidatePath("/dashboard/facilities")
    return { success: true, facility: data }
  } catch (error: any) {
    console.error("[v0] Admin create facility error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function adminUpdateFacility(input: AdminUpdateFacilityInput) {
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
      return { error: "Chỉ System Admin mới có quyền thực hiện chức năng này" }
    }

    let calculatedExpiryDate = input.fda_expiry_date
    if (input.fda_registration_date && !input.fda_expiry_date) {
      const regDate = new Date(input.fda_registration_date)
      regDate.setFullYear(regDate.getFullYear() + 2)
      calculatedExpiryDate = regDate.toISOString().split("T")[0]
    }

    const { data, error } = await supabase
      .from("facilities")
      .update({
        name: input.name,
        facility_type: input.facility_type,
        location_code: input.location_code,
        address: input.address,
        gps_coordinates: input.gps_coordinates || null,
        certification_status: input.certification_status,
        fda_facility_number: input.fda_facility_number || null,
        us_agent_id: input.us_agent_id || null,
        fda_registration_date: input.fda_registration_date || null,
        agent_registration_date: input.agent_registration_date || null,
        fda_expiry_date: calculatedExpiryDate || null,
        registration_email: input.registration_email || null,
        duns_number: input.duns_number || null,
        email: input.email || null,
        phone: input.phone || null,
        fda_registration_status: input.fda_registration_status || "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.facility_id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Admin facility update error:", error)
      return { error: error.message }
    }

    revalidatePath("/admin/facilities")
    revalidatePath("/dashboard/facilities")
    return { success: true, facility: data }
  } catch (error: any) {
    console.error("[v0] Admin update facility error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function adminDeleteFacility(facilityId: string) {
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
      return { error: "Chỉ System Admin mới có quyền thực hiện chức năng này" }
    }

    const { data: facility } = await supabase.from("facilities").select("company_id").eq("id", facilityId).single()

    const { error: deleteError } = await supabase.from("facilities").delete().eq("id", facilityId)

    if (deleteError) {
      console.error("[v0] Admin facility deletion error:", deleteError)
      return { error: deleteError.message }
    }

    if (facility?.company_id) {
      await decrementFacilityCount(facility.company_id)
    }

    revalidatePath("/admin/facilities")
    revalidatePath("/dashboard/facilities")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Admin delete facility error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
