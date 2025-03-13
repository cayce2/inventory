/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { notificationSettingsSchema } from "@/lib/validations"

export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      notificationSettingsSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { emailNotifications, smsNotifications } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: { emailNotifications, smsNotifications } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification settings updated successfully" })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    return NextResponse.json({ error: "An error occurred while updating notification settings" }, { status: 500 })
  }
}

