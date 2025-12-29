import { createClient } from "@/lib/supabase/client"

/**
 * Hàm xử lý đăng xuất người dùng tập trung.
 * Được sử dụng bởi các component client-side như AdminNav.
 */
export const handleSignOut = async () => {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("[v0] Lỗi khi đăng xuất:", error.message)
    }

    // Chuyển hướng về trang đăng nhập sau khi đăng xuất thành công
    // Sử dụng window.location.href vì đây là client-side utility
    window.location.href = "/auth/sign-in"
  } catch (err) {
    console.error("[v0] Lỗi hệ thống khi đăng xuất:", err)
    window.location.href = "/auth/sign-in"
  }
}
