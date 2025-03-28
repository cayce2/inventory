import { NextResponse } from "next/server"
import { checkAndUpdateSubscriptions } from "@/lib/notificationManager"

// This route will be triggered daily at midnight (UTC)
export const dynamic = "force-dynamic"
export const maxDuration = 60 // 5 minutes max duration

// Update the export const config to use the correct format for Vercel Cron Jobs
export const config = {
  runtime: "edge",
  regions: ["iad1"], // Optional: specify a single region to avoid duplicate cron executions
}

// Update the cron schedule using Vercel's format
export const cron = "0 0 * * *" // Run at midnight every day

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

