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

    console.log(`Attempting to delete notification: ${notificationId} for user: ${userId}`)

    // Validate that notificationId is a valid ObjectId
    let objectId
    try {
      objectId = new ObjectId(notificationId)
    } catch (error) {
      console.error(`Invalid ObjectId format: ${notificationId}`, error)
      return NextResponse.json({ error: "Invalid notification ID format" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // First check if the notification exists
    const notification = await db.collection("notifications").findOne({
      _id: objectId,
    })

    if (!notification) {
      console.error(`Notification not found: ${notificationId}`)
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Check if the notification belongs to the user
    if (notification.userId.toString() !== userId.toString()) {
      console.error(`Notification ${notificationId} belongs to user ${notification.userId}, not ${userId}`)
      return NextResponse.json({ error: "Unauthorized to delete this notification" }, { status: 403 })
    }

    const result = await db.collection("notifications").deleteOne({
      _id: objectId,
      userId: new ObjectId(userId),
    })

    console.log(`Delete result: matchedCount=${result.deletedCount}`)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "An error occurred while deleting the notification" }, { status: 500 })
  }
}

