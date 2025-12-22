"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkFacilityQuota } from "@/lib/quota"
import { incrementFacilityCount, decrementFacilityCount } from "@/lib/usage-tracker"

interface CreateFacilityInput {
  name: string
  facility_type: string
  location_code: string
  address: string
  gps_coordinates?: string
  certification_status: string
}

export async function createFacility(input: CreateFacilityInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()

    if (!profile?.company_id) {
      return { error: "Bạn chưa có công ty. Vui lòng tạo công ty trước." }
    }

    // Check quota before creating facility
    const quotaCheck = await checkFacilityQuota(profile.company_id)

    if (!quotaCheck.allowed) {
      if (quotaCheck.subscriptionStatus === "none") {
        return { error: "Công ty chưa có gói dịch vụ. Vui lòng đăng ký gói dịch vụ trước." }
      }
      if (quotaCheck.maxAllowed === -1) {
        return { error: "Gói dịch vụ không hoạt động." }
      }
      return {
        error: `Đã đạt giới hạn cơ sở (${quotaCheck.currentUsage}/${quotaCheck.maxAllowed}). Vui lòng nâng cấp gói dịch vụ.`,
      }
    }

    const { data, error } = await supabase
      .from("facilities")
      .insert({
        ...input,
        company_id: profile.company_id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Facility creation error:", error)
      return { error: error.message }
    }

    // Increment facility count after successful creation
    await incrementFacilityCount(profile.company_id)

    revalidatePath("/dashboard/facilities")
    return { success: true, facility: data }
  } catch (error: any) {
    console.error("[v0] Create facility error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function deleteFacility(facilityId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    // Get facility's company_id before deleting
    const { data: facility } = await supabase.from("facilities").select("company_id").eq("id", facilityId).single()

    const { error: deleteError } = await supabase.from("facilities").delete().eq("id", facilityId)

    if (deleteError) {
      console.error("[v0] Facility deletion error:", deleteError)
      return { error: deleteError.message }
    }

    // Decrement facility count after successful deletion
    if (facility?.company_id) {
      await decrementFacilityCount(facility.company_id)
    }

    revalidatePath("/dashboard/facilities")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Delete facility error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
