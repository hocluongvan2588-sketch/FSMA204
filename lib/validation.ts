import { z } from "zod"

/**
 * Common validation schemas
 */

export const UUIDSchema = z.string().uuid()

export const EmailSchema = z.string().email()

export const PasswordSchema = z.string().min(8, "Password must be at least 8 characters")

export const DecimalSchema = z.string().transform((x) => {
  const num = Number.parseFloat(x)
  if (isNaN(num)) throw new Error("Invalid decimal value")
  return num
})

export const CompanySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

export const FacilitySchema = z.object({
  name: z.string().min(2, "Facility name is required"),
  facilityType: z.enum(["production", "distribution", "cold_storage", "retail"]),
  locationCode: z.string().min(1, "Location code is required"),
  address: z.string().min(5, "Address is required"),
  gpsCoordinates: z.string().optional(),
})

export const ProductSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  productName: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
})
