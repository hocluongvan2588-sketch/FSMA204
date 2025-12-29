import { getSession as getSimpleSession } from "@/lib/simple-auth"
import { redirect } from "next/navigation"

export async function getSession() {
  return await getSimpleSession()
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.role)) {
    redirect("/unauthorized")
  }

  return session
}
