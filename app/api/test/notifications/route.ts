import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { createNotification } from "@/lib/notificationManager"
import { runNotificationChecks } from "@/lib/cronJobs"

// This endpoint is for testing purposes only and should be removed in production
export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, type, title, message } = await req.json()

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // Create a test notification
    if (action === "create") {
      if (!type || !title || !message) {
        return NextResponse.json({ error: "Type, title, and message are required for create action" }, { status: 400 })
      }

      const success = await createNotification(userId, type as "subscription" | "lowStock" | "system", title, message)

      if (success) {
        return NextResponse.json({ message: "Test notification created successfully" }, { status: 200 })
      } else {
        return NextResponse.json({ error: "Failed to create test notification" }, { status: 500 })
      }
    }

    // Run notification checks manually
    if (action === "run-checks") {
      const success = await runNotificationChecks()

      if (success) {
        return NextResponse.json({ message: "Notification checks completed successfully" }, { status: 200 })
      } else {
        return NextResponse.json({ error: "Error running notification checks" }, { status: 500 })
      }
    }

    // Create test data for subscription notifications
    if (action === "test-subscription") {
      const client = await clientPromise
      const db = client.db("inventory_management")

      // Get the user
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Set subscription to expire in 5 days
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 5)

      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            subscriptionStatus: "active",
            subscriptionEndDate: expiryDate,
          },
        },
      )

      // Run notification checks to generate subscription notifications
      await runNotificationChecks()

      return NextResponse.json(
        {
          message: "Test subscription data created and notification checks run",
          subscriptionEndDate: expiryDate,
        },
        { status: 200 },
      )
    }

    // Create test data for low stock notifications
    if (action === "test-low-stock") {
      const client = await clientPromise
      const db = client.db("inventory_management")

      // Find user's inventory items
      const items = await db
        .collection("inventory")
        .find({ userId: new ObjectId(userId) })
        .limit(3)
        .toArray()

      if (items.length === 0) {
        return NextResponse.json({ error: "No inventory items found for this user" }, { status: 404 })
      }

      // Update items to have low stock
      const updatePromises = items.map((item) =>
        db.collection("inventory").updateOne({ _id: item._id }, { $set: { quantity: 1, lowStockThreshold: 5 } }),
      )

      await Promise.all(updatePromises)

      // Run notification checks to generate low stock notifications
      await runNotificationChecks()

      return NextResponse.json(
        {
          message: "Test low stock data created and notification checks run",
          updatedItems: items.map((item) => item.name),
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in test notifications endpoint:", error)
    return NextResponse.json({ error: "An error occurred while testing notifications" }, { status: 500 })
  }
}

