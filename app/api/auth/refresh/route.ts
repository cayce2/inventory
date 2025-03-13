/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { generateToken } from "@/lib/auth-middleware"
import { refreshTokenSchema } from "@/lib/validations"
import { rateLimit } from "@/lib/rate-limiter"

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const data = await req.json()

    // Validate input data
    try {
      refreshTokenSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { token } = data

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    try {
      // Verify the existing token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string
        email: string
        role: string
      }

      // Check if the user still exists and is not suspended
      const client = await clientPromise
      const db = client.db("inventory_management")

      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.userId),
        suspended: { $ne: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found or suspended" }, { status: 401 })
      }

      // Generate a new token
      const newToken = generateToken(user._id.toString(), user.email, user.role)

      return NextResponse.json({ token: newToken }, { status: 200 })
    } catch (error) {
      // Token is invalid or expired
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "An error occurred while refreshing token" }, { status: 500 })
  }
}

