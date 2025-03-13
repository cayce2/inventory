/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest,NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { invoiceActionSchema } from "@/lib/validations"

export async function PUT(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params

    // Validate ObjectId format
    if (!ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID format" }, { status: 400 })
    }

    const data = await req.json()

    // Validate the action
    if (!data.action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // Validate input data
    try {
      invoiceActionSchema.parse({ invoiceId, action: data.action })
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { action } = data

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
      .updateOne({ _id: new ObjectId(invoiceId), userId: new ObjectId(userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "An error occurred while updating the invoice" }, { status: 500 })
  }
}

