/* eslint-disable @typescript-eslint/no-explicit-any */
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

    const data = await req.json()
    const { items, total, payment } = data

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid items data" }, { status: 400 })
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json({ error: "Invalid total amount" }, { status: 400 })
    }

    if (!payment || !payment.method) {
      return NextResponse.json({ error: "Payment information is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Start session for transaction
    const session = client.startSession()
    let salesId: ObjectId | null = null

    try {
      await session.withTransaction(async () => {
        // Create sale record
        const saleResult = await db.collection("pos_sales").insertOne(
          {
            userId: new ObjectId(userId),
            items: items.map((item) => ({
              itemId: new ObjectId(item.itemId),
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total,
            payment,
            timestamp: new Date(),
            status: "completed",
          },
          { session },
        )

        salesId = saleResult.insertedId

        // Update inventory quantities
        for (const item of items) {
          await db
            .collection("inventory")
            .updateOne({ _id: new ObjectId(item.itemId) }, { $inc: { quantity: -item.quantity } }, { session })
        }

        // Create inventory transaction records
        await db.collection("inventory_transactions").insertOne(
          {
            type: "sale",
            relatedDocumentId: salesId,
            items: items.map((item) => ({
              itemId: new ObjectId(item.itemId),
              quantity: -item.quantity, // Negative for sales (decreasing inventory)
            })),
            userId: new ObjectId(userId),
            timestamp: new Date(),
          },
          { session },
        )
      })

      await session.endSession()

      if (!salesId) {
        throw new Error("Failed to create sale - no salesId returned")
      }

      return NextResponse.json(
        {
          message: "Sale processed successfully",
          salesId: String(salesId),
        },
        { status: 201 },
      )
    } catch (error) {
      await session.abortTransaction()
      await session.endSession()
      throw error
    }
  } catch (error) {
    console.error("Error processing sale:", error)
    return NextResponse.json({ error: "An error occurred while processing the sale" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const skip = Number.parseInt(url.searchParams.get("skip") || "0")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Build query
    const query: any = { userId: new ObjectId(userId) }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else if (startDate) {
      query.timestamp = { $gte: new Date(startDate) }
    } else if (endDate) {
      query.timestamp = { $lte: new Date(endDate) }
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Get sales history with pagination
    const sales = await db.collection("pos_sales").find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray()

    // Get total count for pagination
    const totalCount = await db.collection("pos_sales").countDocuments(query)

    return NextResponse.json(
      {
        sales,
        pagination: {
          total: totalCount,
          limit,
          skip,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching sales history:", error)
    return NextResponse.json({ error: "An error occurred while fetching sales history" }, { status: 500 })
  }
}

