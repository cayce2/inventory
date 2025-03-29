/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

// Get notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse URL to get query parameters
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"
    const countOnly = url.searchParams.get("countOnly") === "true"

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Build query
    const query: any = { userId: new ObjectId(userId) }
    if (unreadOnly) {
      query.read = false
    }

    // If countOnly is true, just return the count
    if (countOnly) {
      const total = await db.collection("notifications").countDocuments({ userId: new ObjectId(userId) })
      const unread = await db.collection("notifications").countDocuments({
        userId: new ObjectId(userId),
        read: false,
      })

      return NextResponse.json({ total, unread }, { status: 200 })
    }

    // Get notifications
    const notifications = await db
      .collection("notifications")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json(notifications, { status: 200 })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "An error occurred while fetching notifications" }, { status: 500 })
  }
}

// Create a new notification (for testing purposes)
export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, title, message, relatedItemId } = await req.json()

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Type, title, and message are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const notification = {
      userId: new ObjectId(userId),
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      ...(relatedItemId && { relatedItemId: new ObjectId(relatedItemId) }),
    }

    const result = await db.collection("notifications").insertOne(notification)

    return NextResponse.json(
      {
        message: "Notification created successfully",
        notificationId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "An error occurred while creating the notification" }, { status: 500 })
  }
}

