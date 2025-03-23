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

    console.log("Request URL:", req.url)
    console.log("Filter by userId:", filterByUserId)

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build the query based on whether we're filtering by user ID
    let query = {}

    if (filterByUserId) {
      try {
        // Try multiple query formats to handle different ways userId might be stored
        // First, check if any inventory items exist for this user to understand the data structure
        const sampleItem = await db.collection("inventory").findOne({ userId: { $exists: true } })
        console.log(
          "Sample inventory item with userId:",
          sampleItem ? JSON.stringify(sampleItem, null, 2) : "No items with userId found",
        )

        if (sampleItem) {
          console.log("Sample userId type:", typeof sampleItem.userId)
          console.log("Sample userId value:", sampleItem.userId)

          // If userId is stored as a string
          if (typeof sampleItem.userId === "string") {
            query = { userId: filterByUserId }
            console.log("Using string query:", JSON.stringify(query, null, 2))
          } else {
            // If userId is stored as an ObjectId
            query = { userId: new ObjectId(filterByUserId) }
            console.log("Using ObjectId query:", JSON.stringify(query, null, 2))
          }
        } else {
          // If we can't determine the format, try a more flexible query
          query = {
            $or: [
              { userId: filterByUserId },
              { userId: new ObjectId(filterByUserId) },
              { userId: filterByUserId },
              { userId: new ObjectId(filterByUserId) },
            ],
          }        }
      } catch (error) {
        console.error("Error constructing query for userId:", filterByUserId, error)
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
      }
    }

    // Get inventory items based on the query
    const inventory = await db.collection("inventory").find(query).toArray()

    if (inventory.length === 0) {
      console.log("No inventory items found for the query")

      // If no items found with the specific query, let's check if there are any inventory items at all
      const totalItems = await db.collection("inventory").countDocuments()
      console.log(`Total inventory items in database: ${totalItems}`)

      // Check if the user exists
      if (filterByUserId) {
        const userExists = await db.collection("users").findOne({ _id: new ObjectId(filterByUserId) })
        console.log(`User with ID ${filterByUserId} exists: ${!!userExists}`)
      }
    }

    // Get user information for each inventory item
    const userIds = [
      ...new Set(
        inventory
          .map((item) => {
            if (!item.userId) return null
            return typeof item.userId === "object" ? item.userId.toString() : item.userId
          })
          .filter(Boolean),
      ),
    ]


    const users = await db
      .collection("users")
      .find({
        $or: [
          {
            _id: {
              $in: userIds.map((id) => {
                try {
                  return new ObjectId(id)
                } catch {
                  return id
                }
              }),
            },
          },
          { _id: { $in: userIds } },
        ],
      })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray()


    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    // Add user information to inventory items
    const inventoryWithUserInfo = inventory.map((item) => {
      let userIdStr = null
      if (item.userId) {
        userIdStr = typeof item.userId === "object" ? item.userId.toString() : item.userId
      }
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

