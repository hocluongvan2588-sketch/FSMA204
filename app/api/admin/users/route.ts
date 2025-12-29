import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/simple-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["admin", "system_admin"])

    const isSystemAdmin = session.role === "system_admin"

    const profilesData = await prisma.profiles.findMany({
      where: !isSystemAdmin && session.company_id ? { company_id: session.company_id } : {},
      select: {
        profile_id: true,
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

    const companies = await prisma.companies.findMany({
      where: !isSystemAdmin && session.company_id ? { company_id: session.company_id } : {},
      select: {
        company_id: true,
        name: true,
        registration_number: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ profiles: profilesData, companies: companies || [] })
  } catch (error: any) {
    console.error("[v0] Admin users API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
