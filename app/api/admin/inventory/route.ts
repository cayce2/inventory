import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

// Update the GET function to support filtering by userId
export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the URL to extract query parameters
    const url = new URL(req.url)
    const filterByUserId = url.searchParams.get("userId")

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build the query based on whether we're filtering by userId
    const query = filterByUserId ? { userId: new ObjectId(filterByUserId) } : {}

    // Get inventory items based on the query
    const inventory = await db.collection("inventory").find(query).toArray()

    // Get user information for each inventory item
    const userIds = [...new Set(inventory.map((item) => item.userId))]
    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray()

    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    // Add user information to inventory items
    const inventoryWithUserInfo = inventory.map((item) => {
      const user = userMap.get(item.userId.toString())
      return {
        ...item,
        userName: user ? user.name : null,
        userEmail: user ? user.email : null,
      }
    })

    return NextResponse.json(inventoryWithUserInfo, { status: 200 })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "An error occurred while fetching inventory" }, { status: 500 })
  }
}

