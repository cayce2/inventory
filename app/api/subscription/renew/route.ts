import { NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "@/lib/auth-middleware"
import { renewSubscription } from "@/lib/subscriptionManager"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await renewSubscription(userId)

    return NextResponse.json({ success: true, message: "Subscription renewed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error renewing subscription:", error)
    return NextResponse.json({ error: "An error occurred while renewing the subscription" }, { status: 500 })
  }
}

