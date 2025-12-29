export interface QuotaCheck {
  allowed: boolean
  currentUsage: number
  maxAllowed: number
  remaining: number
  subscriptionStatus: string
}

export interface SubscriptionQuotas {
  maxUsers: number
  maxFacilities: number
  maxProducts: number
  maxStorageGb: number
  currentUsers: number
  currentFacilities: number
  currentProducts: number
  currentStorageGb: number
  subscriptionStatus: string
  packageName: string
  features: {
    fda: boolean
    agent: boolean
    cte: boolean
    reporting: boolean
    api: boolean
    branding: boolean
  }
}

export interface SubscriptionLimits {
  maxUsers: number
  maxFacilities: number
  maxProducts: number
  maxStorageGB: number
}
