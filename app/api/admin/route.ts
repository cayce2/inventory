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

    const { targetUserId, action } = await req.json()
    if (!targetUserId || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    let update = {}
    if (action === "suspend") {
      update = { $set: { suspended: true } }
    } else if (action === "unsuspend") {
      update = { $set: { suspended: false } }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await db.collection("users").updateOne({ _id: new ObjectId(targetUserId) }, update)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "An error occurred while updating the user" }, { status: 500 })
  }
}

