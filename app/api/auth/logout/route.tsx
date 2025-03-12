import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = req.headers.get("Authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Add the token to a blacklist with an expiry
    await db.collection("token_blacklist").insertOne({
      token,
      userId: new ObjectId(userId),
      createdAt: new Date(),
      // Set expiry to match the token's maximum possible lifetime
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    })

    // Clear any active sessions for the user
    await db.collection("sessions").deleteMany({ userId: new ObjectId(userId) })

    // Optionally, you can also update the user's record to indicate they're logged out
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { lastLogout: new Date() } })

    // Clear any server-side session data if you're using server-side sessions
    // This depends on your session management strategy
    // For example, if you're using express-session:
    // req.session.destroy()

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 })
  }
}

