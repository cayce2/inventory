/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextRequest,  NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"

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

