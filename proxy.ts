import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production")

async function getSessionFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload.user as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes without authentication
  const publicRoutes = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/logout"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get session from cookie
  const session = await getSessionFromRequest(request)

  // Protected routes - require authentication
  const protectedRoutes = ["/dashboard", "/admin", "/api/traceability", "/api/admin"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes - require admin role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!session || !["admin", "system_admin"].includes(session.role)) {
      const url = request.nextUrl.clone()
      url.pathname = "/unauthorized"
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages
  if (session && pathname.startsWith("/login")) {
    const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/dashboard"
    const url = request.nextUrl.clone()
    url.pathname = redirectUrl
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
