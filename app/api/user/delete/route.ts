import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, reason } = body

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if a logged-in token was provided — prefer authenticated deletion
    let userId: string | null = null
    const tokenUserId = await authMiddleware(req)
    if (tokenUserId) {
      userId = tokenUserId
    } else {
      // Unauthenticated path: look up user by email (for mobile app users who may not have a token)
      const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() })
      if (!user) {
        // Return generic success to avoid email enumeration
        return NextResponse.json({
          message: "If an account with that email exists, a deletion request has been submitted.",
          requestId: `REQ-${Date.now()}`,
        })
      }

      // If password provided, verify it
      if (password) {
        const bcrypt = await import("bcryptjs")
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }
      }

      userId = user._id.toString()
    }

    // Generate a unique deletion request ID
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    // Check if there's already a pending deletion request
    const existingRequest = await db.collection("deletion_requests").findOne({
      userId,
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json({
        message: "A deletion request is already pending for this account.",
        requestId: existingRequest.requestId,
      })
    }

    // Log the deletion request (do not delete immediately — gives a grace period)
    await db.collection("deletion_requests").insertOne({
      userId,
      email: email.toLowerCase().trim(),
      reason: reason || null,
      requestId,
      status: "pending",
      scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      gracePeriodEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),   // 7-day cancellation window
      createdAt: new Date(),
    })

    // Mark the account as pending deletion so it can be deactivated
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          accountStatus: "pending_deletion",
          deletionRequestedAt: new Date(),
          deletionScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      message: "Account deletion request submitted successfully.",
      requestId,
    })
  } catch (error) {
    console.error("Error processing account deletion request:", error)
    return NextResponse.json(
      { error: "An error occurred while processing your request. Please try again." },
      { status: 500 }
    )
  }
}
