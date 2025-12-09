import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

interface SaleItem {
  itemId: string
  name: string
  quantity: number
  price: number
}

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const url = new URL(req.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 })
    }

    // Format dates to include the full day range
    const startDateTime = new Date(startDate)
    const endDateTime = new Date(endDate)
    endDateTime.setHours(23, 59, 59, 999) // Include the entire end day

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Build query for sales data
    const query = {
      userId: new ObjectId(userId),
      timestamp: {
        $gte: startDateTime,
        $lte: endDateTime,
      },
    }

    // Get all sales in date range
    const sales = await db.collection("pos_sales").find(query).toArray()

    // Calculate total sales amount and transaction count
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
    const transactionCount = sales.length
    const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0

    // Create a map for daily sales
    const dailySalesMap = new Map()

    // Initialize with all dates in range
    const dateIterator = new Date(startDateTime)
    while (dateIterator <= endDateTime) {
      const dateString = dateIterator.toISOString().split("T")[0]
      dailySalesMap.set(dateString, { date: dateString, total: 0, count: 0 })
      dateIterator.setDate(dateIterator.getDate() + 1)
    }

    // Fill in sales data
    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp).toISOString().split("T")[0]
      const dailyData = dailySalesMap.get(saleDate) || { date: saleDate, total: 0, count: 0 }
      dailyData.total += sale.total
      dailyData.count += 1
      dailySalesMap.set(saleDate, dailyData)
    })

    // Convert map to array
    const dailySales = Array.from(dailySalesMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    // Analyze payment methods
    const paymentMethodsMap = new Map()
    sales.forEach((sale) => {
      const method = sale.payment.method
      const methodData = paymentMethodsMap.get(method) || { method, count: 0, total: 0 }
      methodData.count += 1
      methodData.total += sale.total
      paymentMethodsMap.set(method, methodData)
    })

    const paymentMethods = Array.from(paymentMethodsMap.values())

    // Analyze top selling products
    const productMap = new Map()

    sales.forEach((sale) => {
      sale.items.forEach((item: SaleItem) => {
        const productData = productMap.get(item.itemId) || {
          itemId: item.itemId,
          name: item.name,
          quantity: 0,
          revenue: 0,
        }

        productData.quantity += item.quantity
        productData.revenue += item.price * item.quantity
        productMap.set(item.itemId, productData)
      })
    })

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 products

    // Compile report data
    const reportData = {
      dailySales,
      paymentMethods,
      topProducts,
      totalSales,
      transactionCount,
      averageTransaction,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    }

    return NextResponse.json(reportData, { status: 200 })
  } catch (error) {
    console.error("Error generating sales report:", error)
    return NextResponse.json({ error: "An error occurred while generating the sales report" }, { status: 500 })
  }
}

