export const ROLES = {
  USER: "user",
  MANAGER: "manager",
  ADMIN: "admin",
  SYSTEM_ADMIN: "system_admin",
} as const

export const FACILITY_TYPES = {
  PRODUCTION: "production",
  DISTRIBUTION: "distribution",
  COLD_STORAGE: "cold_storage",
  RETAIL: "retail",
} as const

export const EVENT_TYPES = {
  RECEIVING: "receiving",
  COOLING: "cooling",
  PACKING: "packing",
  SHIPPING: "shipping",
  TRANSFORMATION: "transformation",
} as const

export const TLC_STATUS = {
  ACTIVE: "active",
  USED: "used",
  ARCHIVED: "archived",
  EXPIRED: "expired",
} as const

export const WASTE_THRESHOLD = 30 // percentage - if waste differs > 30% from expected, require waste_reason

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
