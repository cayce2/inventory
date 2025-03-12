import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Define validation schema
const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
})

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "An error occurred while fetching user data" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      userUpdateSchema.parse(data)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationError.errors,
          },
          { status: 400 },
        )
      }
    }

    const { name, email, phone } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if email is already in use by another user
    const existingUser = await db.collection("users").findOne({
      email,
      _id: { $ne: new ObjectId(userId) },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 })
    }

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: { name, email, phone, updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating user data:", error)
    return NextResponse.json({ error: "An error occurred while updating user data" }, { status: 500 })
  }
}

