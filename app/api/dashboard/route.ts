/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const totalItems = await db.collection("inventory").countDocuments({ userId })
    const lowStockItems = await db
      .collection("inventory")
      .find({
        userId,
        quantity: { $lt: 5 },
      })
      .toArray()

    const invoices = await db.collection("invoices").find({ userId }).toArray()
    const totalIncome = invoices.reduce((sum, invoice) => sum + (invoice.status === "paid" ? invoice.amount : 0), 0)
    const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid").length

    return NextResponse.json(
      {
        totalItems,
        lowStockItems,
        totalIncome,
        unpaidInvoices,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while fetching dashboard stats" }, { status: 500 })
  }
}

