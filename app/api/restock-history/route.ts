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

    // Parse URL to get query parameters
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "all"
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const itemId = url.searchParams.get("itemId")

    // Determine date range
    const now = new Date()
    let dateFilter: any = {}

    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"), // Include the entire end date
      }
    } else if (period) {
      // Predefined periods
      switch (period) {
        case "day":
          dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) }
          break
        case "week":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0)
          dateFilter = { $gte: weekStart }
          break
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = { $gte: monthStart }
          break
        case "quarter":
          const quarterStart = new Date(now)
          quarterStart.setMonth(now.getMonth() - 3)
          dateFilter = { $gte: quarterStart }
          break
        case "year":
          const yearStart = new Date(now.getFullYear(), 0, 1)
          dateFilter = { $gte: yearStart }
          break
        default: // "all" or invalid period
          dateFilter = {} // No date filter
      }
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Build query
    const query: any = { userId: new ObjectId(userId) }

    // Add date filter if present
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter
    }

    // Add item filter if present
    if (itemId) {
      query.itemId = new ObjectId(itemId)
    }

    // Fetch restock history
    const restockHistory = await db.collection("restockHistory").find(query).sort({ date: -1 }).toArray()

    // Fetch item details for the restock history
    const itemIds = [...new Set(restockHistory.map((record) => record.itemId))]
    const items = await db
      .collection("inventory")
      .find({ _id: { $in: itemIds } })
      .toArray()

    const itemMap = new Map(items.map((item) => [item._id.toString(), item]))

    // Enrich restock history with item details
    const enrichedRestockHistory = restockHistory.map((record) => ({
      ...record,
      itemName: itemMap.get(record.itemId.toString())?.name || "Unknown",
      itemPrice: itemMap.get(record.itemId.toString())?.price || 0,
    }))

    return NextResponse.json(enrichedRestockHistory, { status: 200 })
  } catch (error) {
    console.error("Error fetching restock history:", error)
    return NextResponse.json({ error: "An error occurred while fetching restock history" }, { status: 500 })
  }
}

