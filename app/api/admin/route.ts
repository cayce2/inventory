/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray()
    return NextResponse.json(users, { status: 200 })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "An error occurred while fetching users" }, { status: 500 })
  }
}

// First, let's improve the error logging to see what's causing the 400 error
export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const admin = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Log the raw request body for debugging
    const rawBody = await req.text()
    console.log("Raw request body:", rawBody)

    // Parse the request body
    let data
    try {
      data = JSON.parse(rawBody)
      console.log("Parsed request data:", data)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : String(parseError),
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!data.targetUserId) {
      console.error("Missing targetUserId in request")
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 })
    }

    if (!data.action) {
      console.error("Missing action in request")
      return NextResponse.json({ error: "action is required" }, { status: 400 })
    }

    // Validate action value
    const validActions = ["suspend", "unsuspend", "extend", "cancel"]
    if (!validActions.includes(data.action)) {
      console.error("Invalid action:", data.action)
      return NextResponse.json(
        {
          error: "Invalid action. Must be one of: " + validActions.join(", "),
        },
        { status: 400 },
      )
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(data.targetUserId)) {
      console.error("Invalid ObjectId format for targetUserId:", data.targetUserId)
      return NextResponse.json({ error: "Invalid targetUserId format" }, { status: 400 })
    }

    const { targetUserId, action, days } = data

    const update: { $set: Record<string, any> } = { $set: {} }
    switch (action) {
      case "suspend":
        update.$set.suspended = true
        break
      case "unsuspend":
        update.$set.suspended = false
        break
      case "extend":
        const targetUser = await db.collection("users").findOne({ _id: new ObjectId(targetUserId) })
        if (!targetUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        const currentEndDate = targetUser.subscriptionEndDate ? new Date(targetUser.subscriptionEndDate) : new Date()
        const daysToAdd = Number.parseInt(days || "30") // Default to 30 days if not specified
        const newEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + daysToAdd))
        update.$set.subscriptionStatus = "active"
        update.$set.subscriptionEndDate = newEndDate
        break
      case "cancel":
        update.$set.subscriptionStatus = "cancelled"
        update.$set.subscriptionEndDate = new Date()
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log(`Updating user ${targetUserId} with action ${action}`)
    console.log(`Update data: ${JSON.stringify(update)}`)

    const result = await db.collection("users").updateOne({ _id: new ObjectId(targetUserId) }, update)

    console.log(`Update result: ${JSON.stringify(result)}`)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      {
        error: "An error occurred while updating the user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

