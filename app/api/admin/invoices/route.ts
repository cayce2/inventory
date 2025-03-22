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

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all invoices from all users
    const invoices = await db.collection("invoices").find({}).toArray()

    // Get user information for each invoice
    const userIds = [...new Set(invoices.map((invoice) => invoice.userId))]
    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray()

    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    // Add user information to invoices
    const invoicesWithUserInfo = invoices.map((invoice) => {
      const user = userMap.get(invoice.userId.toString())
      return {
        ...invoice,
        userName: user ? user.name : null,
        userEmail: user ? user.email : null,
      }
    })

    return NextResponse.json(invoicesWithUserInfo, { status: 200 })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "An error occurred while fetching invoices" }, { status: 500 })
  }
}

