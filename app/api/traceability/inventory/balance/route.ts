import { requireAuth } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const inventoryBalanceSchema = z.object({
  tlcId: z.string().uuid(),
})

/**
 * GET /api/traceability/inventory/balance?tlcId=xxx
 * Get current inventory balance for a TLC
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const tlcId = searchParams.get("tlcId")

    if (!tlcId) {
      return NextResponse.json({ success: false, message: "tlcId is required" }, { status: 400 })
    }

    const { tlcId: validatedTlcId } = inventoryBalanceSchema.parse({ tlcId })

    // Get TLC with facility info
    const tlc = await prisma.traceabilityLot.findUnique({
      where: { id: validatedTlcId },
      include: {
        facility: {
          include: { company: true },
        },
        product: true,
      },
    })

    if (!tlc) {
      return NextResponse.json({ success: false, message: "Traceability Lot not found" }, { status: 404 })
    }

    // Verify user belongs to the company
    if (tlc.facility.company.id !== session.user.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    // Get inventory history
    const inventoryLogs = await prisma.inventoryBalanceLog.findMany({
      where: { tlcId: validatedTlcId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          tlc: {
            id: tlc.id,
            tlc: tlc.tlc,
            product: tlc.product.productName,
            batchNumber: tlc.batchNumber,
            productionDate: tlc.productionDate,
            expiryDate: tlc.expiryDate,
            status: tlc.status,
          },
          inventory: {
            totalQuantity: tlc.quantity.toString(),
            availableQuantity: tlc.availableQuantity.toString(),
            reservedQuantity: tlc.reservedQuantity.toString(),
            shippedQuantity: tlc.shippedQuantity.toString(),
            unit: tlc.unit,
          },
          recentHistory: inventoryLogs.map((log) => ({
            eventType: log.eventType,
            quantityChange: log.quantityChange.toString(),
            balanceBefore: log.balanceBefore.toString(),
            balanceAfter: log.balanceAfter.toString(),
            createdAt: log.createdAt,
            notes: log.notes,
          })),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.errors }, { status: 400 })
    }

    console.error("[API Error]", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
