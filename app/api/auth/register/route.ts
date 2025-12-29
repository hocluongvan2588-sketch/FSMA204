import { registerUser } from "@/lib/simple-auth"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  company_id: z.string(),
  role: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    const user = await registerUser(validated)

    return NextResponse.json(
      {
        success: true,
        user,
        message: "User registered successfully",
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
