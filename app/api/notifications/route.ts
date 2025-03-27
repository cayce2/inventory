import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const notifications = await db
      .collection("notifications")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json(notifications, { status: 200 })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "An error occurred while fetching notifications" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId, isRead } = await req.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db
      .collection("notifications")
      .updateOne(
        { _id: new ObjectId(notificationId), userId: new ObjectId(userId) },
        { $set: { isRead: isRead === undefined ? true : isRead } },
      )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "An error occurred while updating the notification" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = await req.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db
      .collection("notifications")
      .deleteOne({ _id: new ObjectId(notificationId), userId: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "An error occurred while deleting the notification" }, { status: 500 })
  }
}

