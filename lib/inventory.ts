import { prisma } from "@/lib/prisma"
import type { Decimal } from "@prisma/client/runtime/library"

/**
 * Get available inventory for a TLC
 */
export async function getAvailableInventory(tlcId: string) {
  const tlc = await prisma.traceabilityLot.findUnique({
    where: { id: tlcId },
    select: {
      availableQuantity: true,
      reservedQuantity: true,
      shippedQuantity: true,
      quantity: true,
      unit: true,
      tlc: true,
    },
  })

  if (!tlc) {
    return null
  }

  return {
    totalQuantity: tlc.quantity.toString(),
    availableQuantity: tlc.availableQuantity.toString(),
    reservedQuantity: tlc.reservedQuantity.toString(),
    shippedQuantity: tlc.shippedQuantity.toString(),
    unit: tlc.unit,
    tlc: tlc.tlc,
  }
}

/**
 * Check if sufficient inventory exists for shipping
 */
export async function canShip(tlcId: string, quantityToShip: Decimal): Promise<boolean> {
  const tlc = await prisma.traceabilityLot.findUnique({
    where: { id: tlcId },
    select: { availableQuantity: true },
  })

  if (!tlc) {
    return false
  }

  return quantityToShip.lessThanOrEqualTo(tlc.availableQuantity)
}

/**
 * Reserve inventory for future shipping
 */
export async function reserveInventory(tlcId: string, quantity: Decimal) {
  return await prisma.traceabilityLot.update({
    where: { id: tlcId },
    data: {
      reservedQuantity: {
        increment: quantity,
      },
      availableQuantity: {
        decrement: quantity,
      },
    },
  })
}

/**
 * Release reserved inventory
 */
export async function releaseReservedInventory(tlcId: string, quantity: Decimal) {
  return await prisma.traceabilityLot.update({
    where: { id: tlcId },
    data: {
      reservedQuantity: {
        decrement: quantity,
      },
      availableQuantity: {
        increment: quantity,
      },
    },
  })
}
