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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if subscription status needs to be updated
    const now = new Date()
    let status = user.subscriptionStatus || "inactive"

    // If subscription has an end date, check if it's expired
    if (user.subscriptionEndDate) {
      const endDate = new Date(user.subscriptionEndDate)

      // If status is active but end date has passed, update to expired
      if (status === "active" && endDate < now) {
        status = "expired"

        // Update in database
        await db
          .collection("users")
          .updateOne({ _id: new ObjectId(userId) }, { $set: { subscriptionStatus: "expired" } })
      }

      // If status is expired/inactive but end date is in the future, update to active
      else if ((status === "expired" || status === "inactive") && endDate > now) {
        status = "active"

        // Update in database
        await db
          .collection("users")
          .updateOne({ _id: new ObjectId(userId) }, { $set: { subscriptionStatus: "active" } })
      }
    }

    return NextResponse.json(
      {
        status,
        endDate: user.subscriptionEndDate || null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return NextResponse.json({ error: "An error occurred while checking subscription status" }, { status: 500 })
  }
}

