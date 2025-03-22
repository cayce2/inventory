import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the URL to extract query parameters
    const url = new URL(req.url)
    const filterByUserId = url.searchParams.get("userId")

    // Add more detailed logging to help diagnose the issue
    console.log("Query parameters:", url.searchParams.toString())
    if (filterByUserId) {
      console.log("Filtering by userId:", filterByUserId)
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Modify the query construction to ensure it works correctly
    let query = {}
    if (filterByUserId) {
      try {
        // Convert the userId to ObjectId for the query
        query = { userId: new ObjectId(filterByUserId) }
        console.log("Using query with ObjectId:", query)
      } catch (error) {
        console.error("Invalid ObjectId format for userId:", filterByUserId, error)
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
      }
    }

    // After fetching inventory, log the results
    const inventory = await db.collection("inventory").find(query).toArray()
    console.log(`Found ${inventory.length} inventory items for query:`, JSON.stringify(query))
    if (inventory.length === 0) {
      console.log("No inventory items found for this query")
    }

    // Get user information for each inventory item
    const userIds = [...new Set(inventory.map((item) => (item.userId ? item.userId.toString() : null)).filter(Boolean))]

    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray()

    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    // Add user information to inventory items
    const inventoryWithUserInfo = inventory.map((item) => {
      const userIdStr = item.userId ? item.userId.toString() : null
      const user = userIdStr ? userMap.get(userIdStr) : null
      return {
        ...item,
        userName: user ? user.name : "Unknown",
        userEmail: user ? user.email : "Unknown",
      }
    })

    return NextResponse.json(inventoryWithUserInfo, { status: 200 })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "An error occurred while fetching inventory" }, { status: 500 })
  }
}

