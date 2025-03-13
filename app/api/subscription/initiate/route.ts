/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { subscriptionActionSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data if any
    if (Object.keys(data).length > 0) {
      try {
        subscriptionActionSchema.parse(data)
      } catch (validationError: any) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationError.errors || validationError.message,
          },
          { status: 400 },
        )
      }
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user's subscription status to pending
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { subscriptionStatus: "pending" } })

    // Here you will integrate with your payment gateway
    // For this example, we're just returning success

    return NextResponse.json({ success: true, message: "Payment initiated" }, { status: 200 })
  } catch (error) {
    console.error("Error initiating subscription:", error)
    return NextResponse.json({ error: "An error occurred while initiating subscription" }, { status: 500 })
  }
}

