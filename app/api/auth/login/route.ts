/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { generateToken } from "@/lib/auth-middleware"
import { rateLimit } from "@/lib/rate-limiter"
import { loginSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting specifically for login attempts
    const rateLimitResponse = await rateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const data = await req.json()

    // Validate input data
    try {
      loginSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { email, password } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    const user = await db.collection("users").findOne({ email })
    if (!user) {
      // Use a generic error message to prevent user enumeration
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    if (user.suspended) {
      return NextResponse.json({ error: "Account suspended", suspended: true }, { status: 403 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // Add a small delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100))
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Use the enhanced token generation function
    const token = generateToken(user._id.toString(), user.email, user.role)

    // Log successful login
    await db.collection("login_history").insertOne({
      userId: user._id,
      timestamp: new Date(),
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred while logging in" }, { status: 500 })
  }
}

