/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params

    // Validate the invoice ID
    if (!invoiceId || !ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if the user is an admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const isAdmin = user?.role === "admin"

    // Build the query - admins can view any invoice, regular users only their own
    const query = isAdmin ? { _id: new ObjectId(invoiceId) } : { _id: new ObjectId(invoiceId), userId }

    // Fetch the invoice
    const invoice = await db.collection("invoices").findOne(query)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Fetch the customer details if available
    let customer = null
    if (invoice.customerId && ObjectId.isValid(invoice.customerId)) {
      customer = await db.collection("customers").findOne({ _id: new ObjectId(invoice.customerId) })
    }

    // Fetch item details for the invoice
    const itemIds = invoice.items.map((item: { itemId: string }) => new ObjectId(item.itemId))
    const items = await db
      .collection("inventory")
      .find({ _id: { $in: itemIds } })
      .toArray()

    // Map the inventory items to the invoice items
    const itemsWithDetails = invoice.items.map((item: { itemId: string, adjustedPrice?: number, quantity: number }) => {
      const inventoryItem = items.find((i) => i._id.toString() === item.itemId.toString())
      const originalPrice = inventoryItem?.price || 0
      const actualPrice = item.adjustedPrice !== undefined ? item.adjustedPrice : originalPrice

      return {
        ...item,
        name: inventoryItem?.name || "Unknown Item",
        price: originalPrice,
        adjustedPrice: item.adjustedPrice,
        subtotal: actualPrice * item.quantity,
      }
    })

    // Fetch payment history if any
    const payments = await db
      .collection("payments")
      .find({ invoiceId: new ObjectId(invoiceId) })
      .sort({ date: -1 })
      .toArray()

    return NextResponse.json(
      {
        invoice: {
          ...invoice,
          items: itemsWithDetails,
        },
        customer,
        payments,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      {
        error: "An error occurred while fetching the invoice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params

    // Validate the invoice ID
    if (!invoiceId || !ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if the user is an admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const isAdmin = user?.role === "admin"

    // Build the query - admins can update any invoice, regular users only their own
    const query = isAdmin ? { _id: new ObjectId(invoiceId) } : { _id: new ObjectId(invoiceId), userId }

    // Check if the invoice exists
    const existingInvoice = await db.collection("invoices").findOne(query)
    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Parse the request body
    const data = await req.json()
    console.log("Update data:", data)

    // Handle different types of updates
    if (data.action) {
      // Handle status change actions
      let updateData = {}

      switch (data.action) {
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

      const result = await db.collection("invoices").updateOne({ _id: new ObjectId(invoiceId) }, { $set: updateData })

      return NextResponse.json(
        {
          message: "Invoice updated successfully",
          modifiedCount: result.modifiedCount,
        },
        { status: 200 },
      )
    } else {
      // Handle field updates
      const allowedFields = ["customerName", "customerPhone", "dueDate", "notes"]

      const updateData: Record<string, any> = {}

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          updateData[field] = data[field]
        }
      })

      // Add updatedAt timestamp
      updateData.updatedAt = new Date()
      updateData.updatedBy = userId

      const result = await db.collection("invoices").updateOne({ _id: new ObjectId(invoiceId) }, { $set: updateData })

      return NextResponse.json(
        {
          message: "Invoice updated successfully",
          modifiedCount: result.modifiedCount,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      {
        error: "An error occurred while updating the invoice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params

    // Validate the invoice ID
    if (!invoiceId || !ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if the invoice exists and belongs to the user
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(invoiceId),
      $or: [
        { userId },
        // Allow admins to add payments to any invoice
        { userId: { $exists: true } }, // This will be filtered by the admin check below
      ],
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // If the invoice doesn't belong to the user, check if they're an admin
    if (invoice.userId !== userId) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Parse the request body
    const data = await req.json()
    console.log("Payment data:", data)

    // Validate payment data
    if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 })
    }

    // Create a payment record
    const paymentData = {
      invoiceId: new ObjectId(invoiceId),
      amount: data.amount,
      method: data.method || "other",
      date: new Date(),
      notes: data.notes || "",
      recordedBy: userId,
    }

    const result = await db.collection("payments").insertOne(paymentData)

    // Update the invoice if payment is complete
    const payments = await db
      .collection("payments")
      .find({ invoiceId: new ObjectId(invoiceId) })
      .toArray()

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)

    if (totalPaid >= invoice.amount) {
      await db
        .collection("invoices")
        .updateOne({ _id: new ObjectId(invoiceId) }, { $set: { status: "paid", paidDate: new Date() } })
    }

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        paymentId: result.insertedId,
        invoiceStatus: totalPaid >= invoice.amount ? "paid" : "unpaid",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error recording payment:", error)
    return NextResponse.json(
      {
        error: "An error occurred while recording the payment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

