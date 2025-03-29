import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { checkAndSendSubscriptionReminders } from "@/lib/subscriptionReminderService"

// Admin endpoint to manually trigger subscription reminders
export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the subscription reminder check
    const remindersSent = await checkAndSendSubscriptionReminders()

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${remindersSent} subscription reminders`,
      remindersSent
    })
  } catch (error) {
    console.error("Error sending subscription reminders:", error)
    return NextResponse.json(
      { error: "An error occurred while sending subscription reminders" },
      { status: 500 }
    )
  }
}
