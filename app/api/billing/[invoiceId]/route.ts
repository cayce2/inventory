/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"

// Get all invoices
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
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "An error occurred while fetching invoices" }, { status: 500 })
  }
}

// Create a new invoice
export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceData = await req.json()
    const { invoiceNumber, customerName, customerPhone, amount, dueDate, items } = invoiceData

    // Validate required fields
    if (!invoiceNumber || !customerName || !dueDate || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if invoice number already exists
    const existingInvoice = await db
      .collection("invoices")
      .findOne({ invoiceNumber, userId })

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 400 })
    }

    // Create invoice with default status as unpaid
    const newInvoice = {
      userId,
      invoiceNumber,
      customerName,
      customerPhone,
      amount,
      dueDate,
      items,
      status: "unpaid",
      createdAt: new Date()
    }

    // Update inventory quantities
    const bulkOps = items.map((item: { itemId: string; quantity: number }) => ({
      updateOne: {
        filter: { _id: new ObjectId(item.itemId), userId },
        update: { $inc: { quantity: -item.quantity } }
      }
    }))

    // Use a transaction to ensure both invoice creation and inventory updates succeed or fail together
    const session = client.startSession()
    try {
      await session.withTransaction(async () => {
        // Insert new invoice
        await db.collection("invoices").insertOne(newInvoice, { session })
        
        // Update inventory quantities
        if (bulkOps.length > 0) {
          await db.collection("inventory").bulkWrite(bulkOps, { session })
        }
      })
    } finally {
      await session.endSession()
    }

    return NextResponse.json({ message: "Invoice created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "An error occurred while creating the invoice" }, { status: 500 })
  }
}

// Update invoice status by ID
export async function PUT(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params
    const { status } = await req.json()

    if (status !== "paid" && status !== "unpaid") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db
      .collection("invoices")
      .updateOne({ _id: new ObjectId(invoiceId), userId }, { $set: { status } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice status updated successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while updating the invoice status" }, { status: 500 })
  }
}

// Delete invoice by ID
export async function DELETE(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params
    
    const client = await clientPromise
    const db = client.db("inventory_management")

    // Get the invoice before deletion to restore inventory if needed
    const invoice = await db
      .collection("invoices")
      .findOne({ _id: new ObjectId(invoiceId), userId })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Optional: Restore inventory quantities when an invoice is deleted
    // This depends on your business logic - you might want to restore quantities
    // only for unpaid invoices or based on other conditions
    if (invoice.status === "unpaid" && invoice.items && invoice.items.length > 0) {
      const bulkOps = invoice.items.map((item: { itemId: string; quantity: number }) => ({
        updateOne: {
          filter: { _id: new ObjectId(item.itemId), userId },
          update: { $inc: { quantity: item.quantity } }
        }
      }))

      // Use a transaction to ensure both operations succeed or fail together
      const session = client.startSession()
      try {
        await session.withTransaction(async () => {
          // Delete the invoice
          await db
            .collection("invoices")
            .deleteOne({ _id: new ObjectId(invoiceId), userId }, { session })
          
          // Restore inventory quantities
          if (bulkOps.length > 0) {
            await db.collection("inventory").bulkWrite(bulkOps, { session })
          }
        })
      } finally {
        await session.endSession()
      }
    } else {
      // If we don't need to restore inventory, just delete the invoice
      await db
        .collection("invoices")
        .deleteOne({ _id: new ObjectId(invoiceId), userId })
    }

    return NextResponse.json({ message: "Invoice deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "An error occurred while deleting the invoice" }, { status: 500 })
  }
}