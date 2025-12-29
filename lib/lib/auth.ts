import { hashPassword, verifyPassword } from "./password"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().min(2),
  registrationNumber: z.string(),
})

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        // Validate input
        const { email, password } = signInSchema.parse(credentials)

        // Find user by email
        const user = await prisma.profile.findUnique({
          where: { email },
          include: { company: true },
        })

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password")
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.hashedPassword)
        if (!isPasswordValid) {
          throw new Error("Invalid email or password")
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("User account is disabled")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: null,
          role: user.role,
          companyId: user.companyId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.companyId = (user as any).companyId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function createUser(data: z.infer<typeof signUpSchema>) {
  const { email, password, fullName, companyName, registrationNumber } = signUpSchema.parse(data)

  // Check if user already exists
  const existingUser = await prisma.profile.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("User already exists")
  }

  // Check if company already exists
  let company = await prisma.company.findUnique({
    where: { registrationNumber },
  })

  // Create company if it doesn't exist
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: companyName,
        registrationNumber,
        address: "", // To be filled later
        displayName: companyName,
      },
    })
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = await prisma.profile.create({
    data: {
      email,
      fullName,
      hashedPassword,
      companyId: company.id,
      role: "admin", // First user is admin
    },
  })

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    companyId: user.companyId,
  }
}

export async function updatePassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)

  return await prisma.profile.update({
    where: { id: userId },
    data: { hashedPassword },
  })
}
