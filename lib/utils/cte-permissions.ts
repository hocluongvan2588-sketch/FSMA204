export type OrganizationType = "farm" | "packing_house" | "processor" | "distributor" | "retailer" | "importer" | "port"

export type CTEType =
  | "harvest"
  | "cooling"
  | "packing"
  | "receiving"
  | "transformation"
  | "shipping"
  | "first_receiving"

export interface CTEOption {
  value: CTEType
  label: string
  description: string
}

// Define which CTEs each organization type can create
export const ORGANIZATION_CTE_PERMISSIONS: Record<OrganizationType, CTEType[]> = {
  farm: ["harvest", "cooling", "shipping"],
  packing_house: ["cooling", "packing", "shipping"],
  processor: ["receiving", "transformation", "shipping"],
  distributor: ["receiving", "shipping"],
  retailer: ["receiving"],
  importer: ["first_receiving", "receiving"],
  port: ["first_receiving"],
}

// All available CTE types with labels
export const ALL_CTE_OPTIONS: CTEOption[] = [
  { value: "harvest", label: "Thu hoạch", description: "Harvest - Thu hoạch từ trang trại" },
  { value: "cooling", label: "Làm lạnh", description: "Initial Cooling - Làm lạnh ban đầu" },
  { value: "packing", label: "Đóng gói", description: "First Packing - Đóng gói lần đầu" },
  { value: "receiving", label: "Tiếp nhận", description: "Receiving - Tiếp nhận hàng hóa" },
  { value: "transformation", label: "Chế biến", description: "Transformation - Chế biến/Cắt/Rửa" },
  { value: "shipping", label: "Vận chuyển", description: "Shipping - Gửi hàng đi" },
  {
    value: "first_receiving",
    label: "Tiếp nhận đất liền đầu tiên",
    description: "First Land-based Receiving - Nhập khẩu",
  },
]

/**
 * Get allowed CTE types for an organization
 */
export function getAllowedCTETypes(organizationType: OrganizationType | null | undefined): CTEOption[] {
  if (!organizationType) {
    // If no organization type set, return all CTEs (backward compatibility)
    return ALL_CTE_OPTIONS
  }

  const allowedTypes = ORGANIZATION_CTE_PERMISSIONS[organizationType] || []
  return ALL_CTE_OPTIONS.filter((option) => allowedTypes.includes(option.value))
}

/**
 * Check if an organization can create a specific CTE type
 */
export function canCreateCTE(organizationType: OrganizationType | null | undefined, cteType: CTEType): boolean {
  if (!organizationType) {
    // If no organization type set, allow all (backward compatibility)
    return true
  }

  const allowedTypes = ORGANIZATION_CTE_PERMISSIONS[organizationType] || []
  return allowedTypes.includes(cteType)
}

/**
 * Get CTE type label in Vietnamese
 */
export function getCTELabel(cteType: CTEType): string {
  const option = ALL_CTE_OPTIONS.find((opt) => opt.value === cteType)
  return option?.label || cteType
}
