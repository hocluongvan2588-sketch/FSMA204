import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/password"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production")

export interface SessionUser {
  id: string
  email: string
  full_name: string | null
  role: string
  company_id: string | null
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")

    if (!token?.value) {
      return null
    }

    const verified = await jwtVerify(token.value, JWT_SECRET)
    return verified.payload.user as SessionUser
  } catch (error) {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized - Please login")
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("Forbidden - Insufficient permissions")
  }

  return session
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.profiles.findUnique({
    where: { email },
  })

  if (!user || !user.hashed_password) {
    throw new Error("Invalid email or password")
  }

  const isValid = await verifyPassword(password, user.hashed_password)

  if (!isValid) {
    throw new Error("Invalid email or password")
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    company_id: user.company_id,
  }

  await createSession(sessionUser)

  return sessionUser
}

export async function registerUser(data: {
  email: string
  password: string
  full_name: string
  company_id: string
  role?: string
}) {
  const existing = await prisma.profiles.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    throw new Error("Email already registered")
  }

  const hashedPassword = await hashPassword(data.password)

  const user = await prisma.profiles.create({
    data: {
      email: data.email,
      hashed_password: hashedPassword,
      full_name: data.full_name,
      company_id: data.company_id,
      role: data.role || "user",
    },
  })

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    company_id: user.company_id,
  }

  await createSession(sessionUser)

  return sessionUser
}
