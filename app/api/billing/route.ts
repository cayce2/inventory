/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { invoiceSchema, invoiceActionSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const invoices = await db
      .collection("invoices")
      .find({ userId, deleted: { $ne: true } })
      .toArray()
    return NextResponse.json(invoices, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while fetching invoices" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      invoiceSchema.parse(data)
    } catch (validationError: any) {
      console.error("Invoice validation error:", JSON.stringify(validationError, null, 2))
      console.error("Received data:", JSON.stringify(data, null, 2))
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { invoiceNumber, customerName, customerPhone = "", dueDate, items } = data
    let { amount } = data

    // If amount is not provided, calculate it from the items with adjusted prices
    if (amount === undefined || amount === 0) {
      const client = await clientPromise
      const db = client.db("inventory_management")

      // Fetch all items to calculate the total amount
      const itemIds = items.map((item: { itemId: string }) => new ObjectId(item.itemId))
      const inventoryItems = await db
        .collection("inventory")
        .find({ _id: { $in: itemIds } })
        .toArray()

      // Create a map for quick lookup
      const itemMap = new Map(inventoryItems.map((item) => [item._id.toString(), item]))

      // Calculate the total amount using adjusted prices if available
      amount = items.reduce((total: number, item: { itemId: string; adjustedPrice?: number; quantity: number }) => {
        const inventoryItem = itemMap.get(item.itemId)
        // Use the adjusted price if provided, otherwise use the original price
        const price = item.adjustedPrice !== undefined ? item.adjustedPrice : inventoryItem ? inventoryItem.price : 0
        return total + price * item.quantity
      }, 0)
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Start a session for the transaction
    const session = client.startSession()

    try {
      await session.withTransaction(async () => {
        // Insert the new invoice with adjusted prices
        const result = await db.collection("invoices").insertOne(
          {
            userId,
            invoiceNumber,
            customerName,
            customerPhone,
            amount,
            dueDate,
            items, // This now includes adjustedPrice for items with custom pricing
            status: "unpaid",
            createdAt: new Date(),
            deleted: false,
          },
          { session },
        )

        // Update inventory for each item
        for (const item of items) {
          await db
            .collection("inventory")
            .updateOne({ _id: new ObjectId(item.itemId) }, { $inc: { quantity: -item.quantity } }, { session })
        }
      })

      await session.endSession()
      return NextResponse.json({ message: "Invoice added successfully" }, { status: 201 })
    } catch (error) {
      await session.endSession()
      throw error
    }
  } catch (error) {
    console.error("Error adding invoice:", error)
    return NextResponse.json({ error: "An error occurred while adding the invoice" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      invoiceActionSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { invoiceId, action } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    let updateData: any = {}

    switch (action) {
      case "markPaid":
        updateData = { status: "paid" }
        break
      case "markUnpaid":
        updateData = { status: "unpaid" }
        break
      case "delete":
        updateData = { deleted: true }
        break
      case "restore":
        updateData = { deleted: false }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await db
      .collection("invoices")
      .updateOne({ _id: new ObjectId(invoiceId), userId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "An error occurred while updating the invoice" }, { status: 500 })
  }
}

