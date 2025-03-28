import { NextResponse } from "next/server"
import { checkAndUpdateSubscriptions } from "@/lib/notificationManager"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // 5 minutes max duration

// Vercel configuration
export const runtime = "nodejs"
export const preferredRegion = ["iad1"] // specify a single region to avoid duplicate cron executions

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
