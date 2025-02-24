/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextRequest, NextResponse } from "next/server"
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

    const invoices = await db.collection("invoices").find({ userId }).toArray()
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

    const { invoiceNumber, customerName, customerPhone, amount, dueDate, items } = await req.json()
    const client = await clientPromise
    const db = client.db("inventory_management")

    // Start a session for the transaction
    const session = client.startSession()

    try {
      await session.withTransaction(async () => {
        // Insert the new invoice
        const result = await db.collection("invoices").insertOne(
          {
            userId,
            invoiceNumber,
            customerName,
            customerPhone,
            amount,
            dueDate,
            items,
            status: "unpaid",
            createdAt: new Date(),
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

