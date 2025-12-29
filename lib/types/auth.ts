import type { Session } from "next-auth"

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  companyId: string
}

export interface AuthSession extends Session {
  user: AuthUser
}
