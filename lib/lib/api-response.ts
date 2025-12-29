import { NextResponse } from "next/server"

/**
 * Standardized API response types and helpers
 */

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any[]
}

export function successResponse<T>(data: T, message = "Success", status = 200): NextResponse<ApiResponse<T>> {
  return new NextResponse(
    JSON.stringify({
      success: true,
      message,
      data,
    }),
    { status, headers: { "Content-Type": "application/json" } },
  )
}

export function errorResponse(message: string, errors: any[] = [], status = 400): NextResponse<ApiResponse> {
  return new NextResponse(
    JSON.stringify({
      success: false,
      message,
      errors,
    }),
    { status, headers: { "Content-Type": "application/json" } },
  )
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Unauthorized", [], 401)
}

export function forbiddenResponse(): NextResponse<ApiResponse> {
  return errorResponse("Forbidden", [], 403)
}

export function notFoundResponse(): NextResponse<ApiResponse> {
  return errorResponse("Not found", [], 404)
}
