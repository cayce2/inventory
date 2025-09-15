/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { restockSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      restockSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { itemId, quantity } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Get the current item to record the previous quantity
    const currentItem = await db.collection("inventory").findOne({ _id: new ObjectId(itemId), userId })

    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Update the item quantity and timestamp
    await db
      .collection("inventory")
      .updateOne({ _id: new ObjectId(itemId), userId }, { 
        $inc: { quantity: quantity },
        $set: { updatedAt: new Date() }
      })

    // Add a restock record with additional details
    const restockRecord = {
      itemId: new ObjectId(itemId),
      itemName: currentItem.name,
      itemSku: currentItem.sku,
      quantity,
      previousQuantity: currentItem.quantity,
      newQuantity: currentItem.quantity + quantity,
      date: new Date(),
      userId: new ObjectId(userId),
    }

    await db.collection("restockHistory").insertOne(restockRecord)

    return NextResponse.json({ 
      message: "Item restocked successfully",
      previousQuantity: currentItem.quantity,
      newQuantity: currentItem.quantity + quantity,
      itemName: currentItem.name,
      sku: currentItem.sku
    }, { status: 200 })
  } catch (error) {
    console.error("Error restocking item:", error)
    return NextResponse.json({ error: "An error occurred while restocking the item" }, { status: 500 })
  }
}