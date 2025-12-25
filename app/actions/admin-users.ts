"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { checkUserQuota } from "@/lib/quota"
import { incrementUserCount, decrementUserCount } from "@/lib/usage-tracker"

interface CreateUserInput {
  email: string
  password: string
  fullName: string
  role: string
  companyId?: string
  companyName?: string // Added companyName for system admin to set display name
  phone?: string
  organizationType?: string // Added organization type for FSMA 204 compliance
}

export async function createUser(input: CreateUserInput) {
  try {
    console.log("[v0] Creating user - START")
    console.log("[v0] Input:", { ...input, password: "***" })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not found!")
      return {
        error:
          "Service role key chưa được cấu hình. Vui lòng thêm SUPABASE_SERVICE_ROLE_KEY vào environment variables.",
      }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Current user:", user?.id)

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single()

    console.log("[v0] Current profile:", currentProfile)

    if (!currentProfile || (currentProfile.role !== "admin" && currentProfile.role !== "system_admin")) {
      return { error: "Bạn không có quyền tạo người dùng" }
    }

    if (currentProfile.role === "admin") {
      if (!currentProfile.company_id) {
        return { error: "Bạn chưa có công ty. Vui lòng liên hệ quản trị viên hệ thống." }
      }
      if (input.companyId && input.companyId !== currentProfile.company_id) {
        return { error: "Bạn chỉ có thể tạo người dùng cho công ty của mình" }
      }
      // Force company_id to admin's company
      input.companyId = currentProfile.company_id

      if (input.role === "system_admin" || input.role === "admin") {
        return { error: "Bạn không có quyền tạo quản trị viên. Chỉ System Admin mới có quyền này." }
      }
    }

    if (currentProfile.role !== "system_admin" && input.companyId) {
      const quotaCheck = await checkUserQuota(input.companyId)

      if (!quotaCheck.allowed) {
        if (quotaCheck.subscriptionStatus === "none") {
          return { error: "Công ty chưa có gói dịch vụ. Vui lòng đăng ký gói dịch vụ trước." }
        }
        if (quotaCheck.maxAllowed === -1) {
          return { error: "Gói dịch vụ không hoạt động." }
        }
        return {
          error: `Đã đạt giới hạn người dùng (${quotaCheck.currentUsage}/${quotaCheck.maxAllowed}). Vui lòng nâng cấp gói dịch vụ.`,
        }
      }
      console.log("[v0] Quota check passed:", quotaCheck)
    }

    console.log("[v0] Creating admin client...")
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log("[v0] Admin client created successfully")
    } catch (adminError: any) {
      console.error("[v0] Admin client creation failed:", adminError.message)
      return {
        error: adminError.message.includes("SUPABASE_SERVICE_ROLE_KEY")
          ? "Service role key chưa được cấu hình. Vui lòng thêm SUPABASE_SERVICE_ROLE_KEY vào environment variables. Xem hướng dẫn trong ENV_SETUP.md"
          : `Lỗi khởi tạo admin client: ${adminError.message}`,
      }
    }

    if (currentProfile.role === "system_admin" && input.companyId && input.companyName) {
      console.log("[v0] Updating company display_name:", input.companyName)
      const { error: updateCompanyError } = await adminClient
        .from("companies")
        .update({ display_name: input.companyName })
        .eq("id", input.companyId)

      if (updateCompanyError) {
        console.error("[v0] Failed to update company display_name:", updateCompanyError)
      } else {
        console.log("[v0] Company display_name updated successfully")
      }
    }

    console.log("[v0] Creating auth user with metadata...")
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
      },
    })

    if (authError) {
      console.error("[v0] Auth creation error:", authError)
      return { error: `Lỗi tạo tài khoản: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: "Không thể tạo tài khoản" }
    }

    console.log("[v0] Auth user created:", authData.user.id)

    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log("[v0] Updating profile with additional info...")
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        company_id: input.companyId || null,
        full_name: input.fullName,
        role: input.role,
        phone: input.phone || null,
        organization_type: input.organizationType || null, // Set organization type for CTE permissions
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("[v0] Profile update error:", profileError)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Lỗi cập nhật profile: ${profileError.message}` }
    }

    if (input.companyId) {
      await incrementUserCount(input.companyId)
      console.log("[v0] User count incremented for company:", input.companyId)
    }

    console.log("[v0] Profile updated successfully")
    revalidatePath("/admin/users")
    revalidatePath("/admin/companies")
    revalidatePath("/admin")
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error("[v0] Create user error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function createCompany(input: {
  name: string
  registrationNumber?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  displayName?: string
}) {
  try {
    console.log("[v0] Creating company:", input.name)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!currentProfile || currentProfile.role !== "system_admin") {
      return { error: "Bạn không có quyền tạo công ty" }
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: input.name,
        registration_number: input.registrationNumber || null,
        address: input.address || null,
        phone: input.phone || null,
        email: input.email || null,
        contact_person: input.contactPerson || null,
        display_name: input.displayName || input.name,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Company creation error:", error)
      return { error: error.message }
    }

    console.log("[v0] Company created:", data.id)

    console.log("[v0] Attempting to create FREE subscription for new company")
    const { data: freePackage, error: packageError } = await supabase
      .from("service_packages")
      .select("id, package_code, package_name, monthly_price_usd")
      .eq("package_code", "FREE")
      .eq("is_active", true)
      .single()

    if (packageError || !freePackage) {
      console.error("[v0] FREE package not found:", packageError)
      console.error("[v0] WARNING: Company created but no FREE subscription assigned!")
      console.error("[v0] Please run: scripts/001-seed-service-packages.sql")
      return {
        success: true,
        company: data,
        warning: "Company created but FREE plan could not be assigned. Please contact system administrator.",
      }
    } else {
      console.log("[v0] FREE package found:", freePackage)

      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 100) // Free plan never expires

      const { data: newSubscription, error: subError } = await supabase
        .from("company_subscriptions")
        .insert({
          company_id: data.id,
          package_id: freePackage.id,
          subscription_status: "active", // Critical: Set to 'active', not 'trial'
          billing_cycle: "monthly",
          start_date: startDate.toISOString().split("T")[0], // DATE format
          end_date: endDate.toISOString().split("T")[0], // DATE format
          current_price: freePackage.monthly_price_usd || 0, // Required field
          currency: "USD",
          payment_method: "free",
          payment_provider: "free", // Added for clarity
          current_users_count: 0,
          current_facilities_count: 0,
          current_products_count: 0,
          current_storage_gb: 0,
        })
        .select()
        .single()

      if (subError) {
        console.error("[v0] Failed to create default FREE subscription:", subError)
        return {
          success: true,
          company: data,
          warning: `Company created but subscription failed: ${subError.message}`,
        }
      } else {
        console.log("[v0] FREE subscription created successfully:", newSubscription)
      }
    }

    revalidatePath("/admin/companies")
    revalidatePath("/admin/users")
    return { success: true, company: data }
  } catch (error: any) {
    console.error("[v0] Create company error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function deleteUser(userId: string) {
  try {
    console.log("[v0] Deleting user:", userId)

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not found!")
      return {
        error:
          "Service role key chưa được cấu hình. Vui lòng thêm SUPABASE_SERVICE_ROLE_KEY vào environment variables.",
      }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single()

    if (!currentProfile || (currentProfile.role !== "admin" && currentProfile.role !== "system_admin")) {
      return { error: "Bạn không có quyền xóa người dùng" }
    }

    if (user.id === userId) {
      return { error: "Bạn không thể xóa chính mình" }
    }

    const { data: userProfile } = await supabase.from("profiles").select("company_id, role").eq("id", userId).single()

    if (currentProfile.role === "admin") {
      if (!userProfile || userProfile.company_id !== currentProfile.company_id) {
        return { error: "Bạn chỉ có thể xóa người dùng trong công ty của mình" }
      }
      // Admins cannot delete other admins or system admins
      if (userProfile.role === "admin" || userProfile.role === "system_admin") {
        return { error: "Bạn không thể xóa quản trị viên khác" }
      }
    }

    console.log("[v0] Creating admin client for deletion...")
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.error("[v0] Admin client creation failed:", adminError.message)
      return {
        error: `Lỗi khởi tạo admin client: ${adminError.message}`,
      }
    }

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("[v0] Auth deletion error:", deleteAuthError)
      return { error: `Lỗi xóa tài khoản: ${deleteAuthError.message}` }
    }

    if (userProfile?.company_id) {
      await decrementUserCount(userProfile.company_id)
      console.log("[v0] User count decremented for company:", userProfile.company_id)
    }

    console.log("[v0] User deleted successfully")
    revalidatePath("/admin/users")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Delete user error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
