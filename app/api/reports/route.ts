import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "week"

    const client = await clientPromise
    const db = client.db("inventory_management")

    const currentDate = new Date()
    let startDate: Date

    switch (period) {
      case "day":
        startDate = new Date(currentDate.setHours(0, 0, 0, 0))
        break
      case "week":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7))
        break
      case "month":
        startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1))
        break
      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7))
    }

    const [totalSales, unpaidInvoices, lowStockItems] = await Promise.all([
      db
        .collection("invoices")
        .aggregate([
          {
            $match: {
              userId: new ObjectId(userId),
              createdAt: { $gte: startDate },
              status: "paid",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ])
        .toArray(),
      db
        .collection("invoices")
        .find({
          userId: new ObjectId(userId),
          status: "unpaid",
        })
        .toArray(),
      db
        .collection("inventory")
        .find({
          userId: new ObjectId(userId),
          quantity: { $lt: 5 },
        })
        .toArray(),
    ])

    const reportData = {
      totalSales: totalSales[0]?.total || 0,
      unpaidInvoices,
      lowStockItems,
      period,
    }

    return NextResponse.json(reportData, { status: 200 })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "An error occurred while generating the report" }, { status: 500 })
  }
}

