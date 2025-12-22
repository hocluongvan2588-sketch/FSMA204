"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

interface CreateUserInput {
  email: string
  password: string
  fullName: string
  role: string
  companyId?: string
  phone?: string
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

    console.log("[v0] Creating admin client...")
    let adminClient
    try {
      adminClient = await createAdminClient()
    } catch (adminError: any) {
      console.error("[v0] Admin client creation failed:", adminError.message)
      return {
        error: adminError.message.includes("SUPABASE_SERVICE_ROLE_KEY")
          ? "Service role key chưa được cấu hình. Vui lòng thêm SUPABASE_SERVICE_ROLE_KEY vào environment variables. Xem hướng dẫn trong ENV_SETUP.md"
          : `Lỗi khởi tạo admin client: ${adminError.message}`,
      }
    }

    // Create auth user using Admin API
    console.log("[v0] Creating auth user...")
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
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

    console.log("[v0] Creating profile...")
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      company_id: input.companyId || null,
      full_name: input.fullName,
      role: input.role,
      phone: input.phone || null,
    })

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError)
      // Rollback: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Lỗi tạo profile: ${profileError.message}` }
    }

    revalidatePath("/admin/users")
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error("[v0] Create user error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function createCompany(name: string, registrationNumber?: string) {
  try {
    console.log("[v0] Creating company:", name)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!currentProfile || (currentProfile.role !== "admin" && currentProfile.role !== "system_admin")) {
      return { error: "Bạn không có quyền tạo công ty" }
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        registration_number: registrationNumber || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Company creation error:", error)
      return { error: error.message }
    }

    console.log("[v0] Company created:", data.id)
    revalidatePath("/admin/companies")
    revalidatePath("/admin/users")
    return { success: true, company: data }
  } catch (error: any) {
    console.error("[v0] Create company error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
