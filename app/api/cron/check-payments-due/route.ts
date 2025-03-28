import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createPaymentDueNotification } from "@/lib/notificationManager"

export const config = {
  runtime: "edge",
  regions: ["iad1"], // Optional: specify a single region to avoid duplicate cron executions
}

// Run at 10 AM every day
export const cron = "0 10 * * *"

export async function GET() {
  try {
    console.log("Running payment due check job")

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find all users with payment due
    const usersWithPaymentDue = await db
      .collection("users")
      .find({
        paymentDue: { $gt: 0 },
      })
      .toArray()

    console.log(`Found ${usersWithPaymentDue.length} users with payment due`)

    // Create notifications for each user with payment due
    for (const user of usersWithPaymentDue) {
      await createPaymentDueNotification(user._id.toString(), user.paymentDue || 0)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment due check completed successfully",
        usersChecked: usersWithPaymentDue.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in payment due check cron job:", error)
    return NextResponse.json({ success: false, error: "Failed to check payment due" }, { status: 500 })
  }
}

