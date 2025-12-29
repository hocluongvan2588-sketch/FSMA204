"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/simple-auth"
import { revalidatePath } from "next/cache"
import { checkUserQuota } from "@/lib/quota"
import { incrementUserCount, decrementUserCount } from "@/lib/usage-tracker"
import { logAdminAction } from "@/lib/utils/admin-audit-logger"
import { hashPassword } from "@/lib/password"

interface CreateUserInput {
  email: string
  password: string
  fullName: string
  role: string
  companyId?: string
  companyName?: string
  phone?: string
  organizationType?: string
}

export async function createUser(input: CreateUserInput) {
  try {
    console.log("[v0] Creating user - START")

    const session = await requireAuth()

    const currentProfile = await prisma.profiles.findUnique({
      where: { profile_id: session.id },
      select: { role: true, company_id: true },
    })

    if (!currentProfile || (currentProfile.role !== "admin" && currentProfile.role !== "system_admin")) {
      return { error: "Bạn không có quyền tạo người dùng" }
    }

    // Admin can only create users for their own company
    if (currentProfile.role === "admin") {
      if (!currentProfile.company_id) {
        return { error: "Bạn chưa có công ty. Vui lòng liên hệ quản trị viên hệ thống." }
      }
      if (input.companyId && input.companyId !== currentProfile.company_id) {
        return { error: "Bạn chỉ có thể tạo người dùng cho công ty của mình" }
      }
      input.companyId = currentProfile.company_id

      if (input.role === "system_admin" || input.role === "admin") {
        return { error: "Bạn không có quyền tạo quản trị viên. Chỉ System Admin mới có quyền này." }
      }
    }

    // System admin creating a new admin without company - auto-create company
    if (
      currentProfile.role === "system_admin" &&
      (input.role === "admin" || input.role === "company_admin") &&
      !input.companyId
    ) {
      console.log("[v0] Auto-creating company for new admin user")

      const companyName = input.companyName || `${input.fullName}'s Company`

      const newCompany = await prisma.companies.create({
        data: {
          name: companyName,
          email: input.email,
          contact_person: input.fullName,
        },
      })

      console.log("[v0] Company auto-created:", newCompany.id)
      input.companyId = newCompany.id

      // Create FREE subscription
      const freePackage = await prisma.service_packages.findFirst({
        where: {
          package_code: "FREE",
          is_active: true,
        },
      })

      if (freePackage) {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 100)

        await prisma.company_subscriptions.create({
          data: {
            company_id: newCompany.id,
            package_id: freePackage.id,
            status: "active",
            start_date: startDate,
            end_date: endDate,
            auto_renew: false,
            billing_cycle: "monthly",
            price_paid: 0,
          },
        })

        console.log("[v0] FREE subscription created for company:", newCompany.id)
      }
    }

    // Check quota for non-system admins
    if (currentProfile.role !== "system_admin" && input.companyId) {
      const quotaCheck = await checkUserQuota(input.companyId)

      if (!quotaCheck.allowed) {
        if (quotaCheck.subscriptionStatus === "none") {
          return { error: "Công ty chưa có gói dịch vụ. Vui lòng đăng ký gói dịch vụ trước." }
        }
        return {
          error: `Đã đạt giới hạn người dùng (${quotaCheck.currentUsage}/${quotaCheck.maxAllowed}). Vui lòng nâng cấp gói dịch vụ.`,
        }
      }
    }

    // Hash password using Web Crypto API-based password utilities
    const hashedPassword = await hashPassword(input.password)

    // Create user profile
    const newUser = await prisma.profiles.create({
      data: {
        email: input.email,
        hashed_password: hashedPassword,
        company_id: input.companyId || null,
        full_name: input.fullName,
        role: input.role,
        phone: input.phone || null,
        language_preference: "vi",
      },
    })

    console.log("[v0] User created:", newUser.profile_id)

    // Increment user count
    if (input.companyId) {
      await incrementUserCount(input.companyId)
    }

    await logAdminAction({
      action: "user_create",
      targetUserId: newUser.profile_id,
      targetCompanyId: input.companyId || undefined,
      description: `Created new user: ${input.fullName} (${input.email}) with role: ${input.role}`,
      metadata: {
        user_email: input.email,
        user_name: input.fullName,
        user_role: input.role,
        company_id: input.companyId,
      },
      severity: input.role === "admin" || input.role === "system_admin" ? "high" : "medium",
    })

    revalidatePath("/admin/users")
    revalidatePath("/admin/companies")
    return { success: true, userId: newUser.profile_id }
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

    const session = await requireAuth()

    const currentProfile = await prisma.profiles.findUnique({
      where: { profile_id: session.id },
      select: { role: true },
    })

    if (!currentProfile || currentProfile.role !== "system_admin") {
      return { error: "Bạn không có quyền tạo công ty" }
    }

    const newCompany = await prisma.companies.create({
      data: {
        name: input.name,
        registration_number: input.registrationNumber || null,
        address: input.address || null,
        phone: input.phone || null,
        email: input.email || null,
        contact_person: input.contactPerson || null,
      },
    })

    console.log("[v0] Company created:", newCompany.id)

    // Create FREE subscription
    const freePackage = await prisma.service_packages.findFirst({
      where: {
        package_code: "FREE",
        is_active: true,
      },
    })

    if (!freePackage) {
      console.error("[v0] FREE package not found")
      return {
        success: true,
        company: newCompany,
        warning: "Company created but FREE plan could not be assigned.",
      }
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 100)

    await prisma.company_subscriptions.create({
      data: {
        company_id: newCompany.id,
        package_id: freePackage.id,
        status: "active",
        billing_cycle: "monthly",
        start_date: startDate,
        end_date: endDate,
        price_paid: 0,
        auto_renew: false,
      },
    })

    console.log("[v0] FREE subscription created for company:", newCompany.id)

    revalidatePath("/admin/companies")
    revalidatePath("/admin/users")
    return { success: true, company: newCompany }
  } catch (error: any) {
    console.error("[v0] Create company error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await requireAuth()

    const currentProfile = await prisma.profiles.findUnique({
      where: { profile_id: session.id },
      select: { role: true, company_id: true },
    })

    if (!currentProfile || (currentProfile.role !== "admin" && currentProfile.role !== "system_admin")) {
      return { error: "Bạn không có quyền xóa người dùng" }
    }

    if (session.id === userId) {
      return { error: "Bạn không thể xóa chính mình" }
    }

    const userProfile = await prisma.profiles.findUnique({
      where: { profile_id: userId },
      select: { company_id: true, role: true },
    })

    if (currentProfile.role === "admin") {
      if (!userProfile || userProfile.company_id !== currentProfile.company_id) {
        return { error: "Bạn chỉ có thể xóa người dùng trong công ty của mình" }
      }
      if (userProfile.role === "admin" || userProfile.role === "system_admin") {
        return { error: "Bạn không thể xóa quản trị viên khác" }
      }
    }

    await logAdminAction({
      action: "user_delete",
      targetUserId: userId,
      targetCompanyId: userProfile?.company_id || undefined,
      description: `Deleted user: ${userId}`,
      severity: "critical",
    })

    // Delete user
    await prisma.profiles.delete({
      where: { profile_id: userId },
    })

    // Decrement user count
    if (userProfile?.company_id) {
      await decrementUserCount(userProfile.company_id)
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Delete user error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
