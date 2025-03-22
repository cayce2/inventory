import { NextRequest, NextResponse } from "next/server"
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

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the invoice
    const invoice = await db.collection("invoices").findOne({ _id: new ObjectId(invoiceId) })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get user information
    const invoiceUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(invoice.userId) }, { projection: { name: 1, email: 1 } })

    interface InvoiceItem {
      itemId: ObjectId;
      quantity: number;
    }

    // Get item details for the invoice
    const itemIds = invoice.items.map((item: InvoiceItem) => item.itemId)
    const inventoryItems = await db
      .collection("inventory")
      .find({ _id: { $in: itemIds.map((id: ObjectId) => new ObjectId(id)) } })
      .toArray()

    const itemMap = new Map(inventoryItems.map((item) => [item._id.toString(), item]))

    // Add item details to invoice items
    const itemsWithDetails = invoice.items.map((item: InvoiceItem) => ({
      ...item,
      name: itemMap.get(item.itemId.toString())?.name || "Unknown Item",
      price: itemMap.get(item.itemId.toString())?.price || 0,
    }))

    const invoiceWithDetails = {
      ...invoice,
      items: itemsWithDetails,
      userName: invoiceUser ? invoiceUser.name : null,
      userEmail: invoiceUser ? invoiceUser.email : null,
    }

    return NextResponse.json(invoiceWithDetails, { status: 200 })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "An error occurred while fetching the invoice" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params
    const { action } = await req.json()

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const result = await db.collection("invoices").updateOne({ _id: new ObjectId(invoiceId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "An error occurred while updating the invoice" }, { status: 500 })
  }
}

