"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkProductQuota } from "@/lib/quota"
import { incrementProductCount, decrementProductCount } from "@/lib/usage-tracker"

interface CreateProductInput {
  product_code: string
  product_name: string
  product_name_vi?: string
  description?: string
  category: string
  is_ftl: boolean
  unit_of_measure: string
  requires_cte: boolean
}

export async function createProduct(input: CreateProductInput) {
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

    // Check quota before creating product
    const quotaCheck = await checkProductQuota(profile.company_id)

    if (!quotaCheck.allowed) {
      if (quotaCheck.subscriptionStatus === "none") {
        return { error: "Công ty chưa có gói dịch vụ. Vui lòng đăng ký gói dịch vụ trước." }
      }
      if (quotaCheck.maxAllowed === -1) {
        return { error: "Gói dịch vụ không hoạt động." }
      }
      return {
        error: `Đã đạt giới hạn sản phẩm (${quotaCheck.currentUsage}/${quotaCheck.maxAllowed}). Vui lòng nâng cấp gói dịch vụ.`,
      }
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...input,
        company_id: profile.company_id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Product creation error:", error)
      return { error: error.message }
    }

    // Increment product count after successful creation
    await incrementProductCount(profile.company_id)

    revalidatePath("/dashboard/products")
    return { success: true, product: data }
  } catch (error: any) {
    console.error("[v0] Create product error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}

export async function deleteProduct(productId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Không tìm thấy phiên đăng nhập" }
    }

    // Get product's company_id before deleting
    const { data: product } = await supabase.from("products").select("company_id").eq("id", productId).single()

    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId)

    if (deleteError) {
      console.error("[v0] Product deletion error:", deleteError)
      return { error: deleteError.message }
    }

    // Decrement product count after successful deletion
    if (product?.company_id) {
      await decrementProductCount(product.company_id)
    }

    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Delete product error:", error)
    return { error: error.message || "Có lỗi xảy ra" }
  }
}
