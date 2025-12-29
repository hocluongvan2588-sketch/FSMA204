export type OrganizationType = "farm" | "packing_house" | "processor" | "distributor" | "retailer" | "importer" | "port"

export type CTEType =
  | "harvest"
  | "cooling"
  | "packing"
  | "receiving"
  | "receiving_distributor"
  | "first_receiving"
  | "transformation"
  | "shipping"

export interface CTEOption {
  value: CTEType
  label: string
  description: string
}

// Define which CTEs each organization type can create
export const ORGANIZATION_CTE_PERMISSIONS: Record<OrganizationType, CTEType[]> = {
  farm: ["harvest", "cooling", "shipping"],
  packing_house: ["cooling", "packing", "shipping"],
  processor: ["receiving", "cooling", "packing", "transformation", "shipping"],
  distributor: ["receiving", "shipping"], // Updated to include receiving_distributor
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
  {
    value: "receiving_distributor",
    label: "Tiếp nhận phân phối",
    description: "Receiving Distributor - Tiếp nhận hàng hóa từ nhà phân phối",
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
export function canCreateCTE(
  organizationType: OrganizationType | null | undefined,
  uiCteType: CTEType,
): { canCreate: boolean; error?: string } {
  if (!organizationType) {
    return { canCreate: true }
  }

  const allowedTypes = ORGANIZATION_CTE_PERMISSIONS[organizationType] || []

  // Check both UI type and actual mapped type
  const canCreate = allowedTypes.includes(uiCteType)

  if (!canCreate) {
    return {
      canCreate: false,
      error: `Tổ chức "${organizationType}" không được phép tạo CTE loại "${uiCteType}"`,
    }
  }

  return { canCreate: true }
}

/**
 * Get CTE type label in Vietnamese
 */
export function getCTELabel(cteType: CTEType): string {
  const option = ALL_CTE_OPTIONS.find((opt) => opt.value === cteType)
  return option?.label || cteType
}

/**
 * Get menu items visibility based on organization type
 * Some functions are only relevant to certain business types
 */
export function getVisibleMenuSections(organizationType: OrganizationType | null | undefined): string[] {
  if (!organizationType) {
    // If no organization type set, show all (backward compatibility)
    return ["setup", "production", "compliance", "admin"]
  }

  const menuVisibility: Record<OrganizationType, string[]> = {
    farm: ["setup", "production", "compliance", "admin"],
    packing_house: ["setup", "production", "compliance", "admin"],
    processor: ["setup", "production", "compliance", "admin"],
    distributor: ["setup", "production", "compliance", "admin"],
    retailer: ["setup", "production", "compliance", "admin"],
    importer: ["setup", "production", "compliance", "admin"],
    port: ["setup", "production", "compliance", "admin"],
  }

  return menuVisibility[organizationType] || ["setup", "production", "compliance", "admin"]
}

/**
 * Get CTE menu items visibility based on organization type
 * Farms should NOT see Transformation option, Distributors shouldn't see Transformation, etc.
 */
export function getVisibleCTEMenuItems(organizationType: OrganizationType | null | undefined): CTEType[] {
  if (!organizationType) {
    return [
      "harvest",
      "cooling",
      "packing",
      "receiving",
      "receiving_distributor",
      "first_receiving",
      "transformation",
      "shipping",
    ]
  }

  const allowedCTEs = ORGANIZATION_CTE_PERMISSIONS[organizationType] || []
  return allowedCTEs
}

/**
 * Check if a specific menu item should be visible to this organization type
 */
export function isMenuItemVisible(organizationType: OrganizationType | null | undefined, menuItem: string): boolean {
  if (!organizationType) return true // Show all if no type set

  // Map menu items to organization types that should see them
  const menuVisibility: Record<string, OrganizationType[]> = {
    // Setup section
    products: ["farm", "packing_house", "processor", "distributor", "retailer", "importer"],
    facilities: ["farm", "packing_house", "processor", "distributor", "retailer", "importer"],
    operators: ["farm", "packing_house", "processor", "distributor"],

    // Production section
    tlc: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"],
    cte: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"],
    lots: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"],
    traceability: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"],

    // Compliance section
    reports: ["farm", "packing_house", "processor", "distributor", "importer"],
    reconciliation: ["packing_house", "processor", "distributor"], // Farms don't reconcile, ports don't reconcile
    alerts: ["farm", "packing_house", "processor", "distributor", "importer"],

    // Admin section
    notifications: ["farm", "packing_house", "processor", "distributor", "retailer", "importer"],
    company: ["farm", "packing_house", "processor", "distributor", "retailer", "importer"],
    settings: ["farm", "packing_house", "processor", "distributor", "retailer", "importer"],
  }

  const visibleToTypes = menuVisibility[menuItem]
  if (!visibleToTypes) return true // Show if not in restriction list

  return visibleToTypes.includes(organizationType)
}

/**
 * Check if a menu item should be visible based on organization type
 * This prevents confusing users by showing options they can't use
 */
export function isMenuItemVisibleForOrgType(
  organizationType: OrganizationType | null | undefined,
  menuItem: string,
): boolean {
  if (!organizationType) return true // Show all if no type set

  // Map menu items to organization types that can use them
  const menuVisibility: Record<string, OrganizationType[]> = {
    // Core functionality - visible to all including Traceability Search
    lots: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"],
    cte: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"],
    traceability: ["farm", "packing_house", "processor", "distributor", "retailer", "importer", "port"], // Confirmed ALL can search traceability

    // Production
    shipments: ["farm", "packing_house", "processor", "distributor"],

    // Compliance
    reports: ["farm", "packing_house", "processor", "distributor", "importer"],
    reconciliation: ["packing_house", "processor", "distributor"],
    alerts: ["farm", "packing_house", "processor", "distributor", "importer"],
  }

  const visibleToTypes = menuVisibility[menuItem]
  if (!visibleToTypes) return true // Show if not restricted
  return visibleToTypes.includes(organizationType)
}

/**
 * Map UI event type to actual backend event type based on organization
 * For example: distributor selecting "receiving" should insert "receiving_distributor"
 * importer selecting "receiving" should insert "first_receiving"
 */
export function getActualEventType(
  uiEventType: CTEType,
  organizationType: OrganizationType | null | undefined,
): CTEType {
  if (!organizationType) return uiEventType

  // Map UI event type to actual database event type
  const eventTypeMapping: Record<OrganizationType, Record<string, CTEType>> = {
    farm: {},
    packing_house: {},
    processor: {},
    distributor: {
      receiving: "receiving_distributor", // Distributor receiving → receiving_distributor
    },
    retailer: {},
    importer: {
      receiving: "first_receiving", // Importer receiving → first_receiving (land-based)
    },
    port: {},
  }

  const mapping = eventTypeMapping[organizationType]
  return (mapping && mapping[uiEventType]) || uiEventType
}
