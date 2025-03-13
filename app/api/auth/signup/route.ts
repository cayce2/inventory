import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { signupSchema } from "@/lib/validations"
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
      signupSchema.parse(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { name, email, phone, password } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Check if this is the first user
    const userCount = await db.collection("users").countDocuments()
    const role = userCount === 0 ? "admin" : "user"

    const result = await db.collection("users").insertOne({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      suspended: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "User created successfully", userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "An error occurred while creating the user" }, { status: 500 })
  }
}

