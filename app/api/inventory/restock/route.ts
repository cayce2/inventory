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

    const { itemId, quantity } = await req.json()

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid restock data" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Update the item quantity
    const updateResult = await db
      .collection("inventory")
      .updateOne({ _id: new ObjectId(itemId) }, { $inc: { quantity: quantity } })

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Add a restock record
    const restockRecord = {
      itemId: new ObjectId(itemId),
      quantity,
      date: new Date(),
      userId: new ObjectId(userId),
    }

    await db.collection("restockHistory").insertOne(restockRecord)

    return NextResponse.json({ message: "Item restocked successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error restocking item:", error)
    return NextResponse.json({ error: "An error occurred while restocking the item" }, { status: 500 })
  }
}

