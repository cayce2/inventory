import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

// Mark a notification as read
export async function PUT(req: NextRequest, { params }: { params: { notificationId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = params
    const { read } = await req.json()

    if (read === undefined) {
      return NextResponse.json({ error: "Read status is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db
      .collection("notifications")
      .updateOne({ _id: new ObjectId(notificationId), userId: new ObjectId(userId) }, { $set: { read } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "An error occurred while updating the notification" }, { status: 500 })
  }
}

// Delete a notification
export async function DELETE(req: NextRequest, { params }: { params: { notificationId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = params

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("notifications").deleteOne({
      _id: new ObjectId(notificationId),
      userId: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "An error occurred while deleting the notification" }, { status: 500 })
  }
}

