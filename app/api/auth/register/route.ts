import { createUser } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const user = await createUser(body)

    return NextResponse.json(
      {
        success: true,
        user,
        message: "User created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 },
      )
    }

    const message = error instanceof Error ? error.message : "An error occurred"

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    )
  }
}
