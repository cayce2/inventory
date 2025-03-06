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

    return NextResponse.json(
      {
        status: user.subscriptionStatus || "inactive",
        endDate: user.subscriptionEndDate || null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return NextResponse.json({ error: "An error occurred while checking subscription status" }, { status: 500 })
  }
}

