import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from '@supabase/supabase-js'

// Khởi tạo Supabase Admin (Server-side duy nhất)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. Lấy token từ Header (thay vì dùng NextAuth getServerSession đang lỗi)
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    // 2. Xác thực user qua Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 3. Truy vấn Profile qua Prisma
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        company_id: true,
        organization_type: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Kiểm tra quyền Admin
    if (profile.role !== "admin" && profile.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const isSystemAdmin = profile.role === "system_admin"

    // 4. Lấy dữ liệu Profiles
    const profilesData = await prisma.profiles.findMany({
      where: !isSystemAdmin && profile.company_id ? { company_id: profile.company_id } : {},
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        phone: true,
        created_at: true,
        organization_type: true,
        allowed_cte_types: true,
        company_id: true,
      },
      orderBy: { created_at: "desc" },
    })

    // 5. Lấy dữ liệu Companies
    const companies = await prisma.companies.findMany({
      where: !isSystemAdmin && profile.company_id ? { id: profile.company_id } : {},
      select: {
        id: true,
        name: true,
        display_name: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ profiles: profilesData, companies: companies || [] })
  } catch (error: any) {
    console.error("[v0] Admin users API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
