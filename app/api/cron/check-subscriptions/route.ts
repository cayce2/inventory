import { NextResponse } from "next/server"
import { checkAndUpdateSubscriptions } from "@/lib/notificationManager"

// Route Segment Config
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes max duration

// This is the new way to configure cron in Next.js
export const revalidate = {
  type: "cron",
  schedule: "0 0 * * *", // Run at midnight every day
}

export async function GET() {
  try {
    console.log("Running subscription check and update job")
    await checkAndUpdateSubscriptions()

    return NextResponse.json({ success: true, message: "Subscription check completed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in subscription check cron job:", error)
    return NextResponse.json({ success: false, error: "Failed to check subscriptions" }, { status: 500 })
  }
}

