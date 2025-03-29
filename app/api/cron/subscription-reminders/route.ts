import { NextResponse } from "next/server"
import { checkAndSendSubscriptionReminders } from "@/lib/subscriptionReminderService"

// This endpoint will be called by the cron job
export async function GET(req: Request) {
  try {
    // Verify the request is authorized (optional but recommended)
    const authHeader = req.headers.get("Authorization")
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, require authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the subscription reminder check
    const remindersSent = await checkAndSendSubscriptionReminders()

    return NextResponse.json({
      success: true,
      message: `Successfully processed subscription reminders`,
      remindersSent
    })
  } catch (error) {
    console.error("Error processing subscription reminders:", error)
    return NextResponse.json(
      { error: "An error occurred while processing subscription reminders" },
      { status: 500 }
    )
  }
}
