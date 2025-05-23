import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

// Mark all notifications as read
export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db
      .collection("notifications")
      .updateMany({ userId: new ObjectId(userId), read: false }, { $set: { read: true } })

    return NextResponse.json(
      {
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json({ error: "An error occurred while marking all notifications as read" }, { status: 500 })
  }
}

