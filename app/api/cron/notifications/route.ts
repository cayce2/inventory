import { NextResponse } from "next/server"
import { runNotificationChecks } from "@/lib/cronJobs"

// This endpoint will be called by a cron job
export async function POST(req: Request) {
  try {
    // Verify the request is from an authorized source
    const authHeader = req.headers.get("Authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run notification checks
    const success = await runNotificationChecks()

    if (success) {
      return NextResponse.json({ message: "Notification checks completed successfully" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Error running notification checks" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "An error occurred while running the cron job" }, { status: 500 })
  }
}

