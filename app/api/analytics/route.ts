/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { period, customDateRange, startDate, endDate } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Determine date range
    const now = new Date()
    let dateFilter: any = {}

    if (customDateRange && startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      }
    } else if (period) {
      switch (period) {
        case "7days":
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(now.getDate() - 7)
          dateFilter = { $gte: sevenDaysAgo }
          break
        case "30days":
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(now.getDate() - 30)
          dateFilter = { $gte: thirtyDaysAgo }
          break
        case "90days":
          const ninetyDaysAgo = new Date(now)
          ninetyDaysAgo.setDate(now.getDate() - 90)
          dateFilter = { $gte: ninetyDaysAgo }
          break
        case "thisYear":
          const yearStart = new Date(now.getFullYear(), 0, 1)
          dateFilter = { $gte: yearStart }
          break
        default:
          dateFilter = {}
      }
    }

    // Fetch paid invoices with date filter
    const invoiceQuery: any = { userId, status: "paid", deleted: { $ne: true } }
    if (Object.keys(dateFilter).length > 0) {
      invoiceQuery.createdAt = dateFilter
    }
    const invoices = await db.collection("invoices").find(invoiceQuery).toArray()

    // Calculate total revenue and average order value
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const averageOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0

    // Aggregate item sales data
    const itemSalesMap = new Map<string, { totalSold: number; revenue: number; prices: number[]; lastSold: Date }>()

    for (const invoice of invoices) {
      for (const item of invoice.items) {
        const itemId = item.itemId.toString()
        const price = item.adjustedPrice !== undefined ? item.adjustedPrice : item.price || 0
        const revenue = price * item.quantity

        if (itemSalesMap.has(itemId)) {
          const existing = itemSalesMap.get(itemId)!
          existing.totalSold += item.quantity
          existing.revenue += revenue
          existing.prices.push(price)
          if (invoice.createdAt > existing.lastSold) {
            existing.lastSold = invoice.createdAt
          }
        } else {
          itemSalesMap.set(itemId, {
            totalSold: item.quantity,
            revenue: revenue,
            prices: [price],
            lastSold: invoice.createdAt,
          })
        }
      }
    }

    // Fetch item details
    const itemIds = Array.from(itemSalesMap.keys()).map((id) => new ObjectId(id))
    const items = await db
      .collection("inventory")
      .find({ _id: { $in: itemIds } })
      .toArray()

    const itemMap = new Map(items.map((item) => [item._id.toString(), item]))

    // Build analytics data
    const itemSales = Array.from(itemSalesMap.entries()).map(([itemId, data]) => {
      const item = itemMap.get(itemId)
      const averagePrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length

      return {
        _id: itemId,
        name: item?.name || "Unknown Item",
        totalSold: data.totalSold,
        revenue: data.revenue,
        averagePrice: averagePrice,
        lastSold: data.lastSold.toISOString(),
      }
    })

    // Sort by revenue to get top performers
    const topPerformers = [...itemSales].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Sort all items by total sold
    itemSales.sort((a, b) => b.totalSold - a.totalSold)

    // Calculate total items sold
    const totalItemsSold = itemSales.reduce((sum, item) => sum + item.totalSold, 0)

    return NextResponse.json(
      {
        itemSales,
        topPerformers,
        totalRevenue,
        totalItemsSold,
        averageOrderValue,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "An error occurred while fetching analytics data" }, { status: 500 })
  }
}
