import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const monthOffset = parseInt(searchParams.get('monthOffset') || '0', 10)

    const client = await clientPromise
    const db = client.db("inventory_management")

    // ─── Run independent top-level queries in parallel ────────────────────────
    const [
      totalItems,
      lowStockItems,
      invoiceTotals,
      previousMonthInventoryData,
      previousMonthInvoiceData,
      trendData,
      revenueByCategory,
      kpiData,
    ] = await Promise.all([
      // 1. Total inventory count
      db.collection("inventory").countDocuments({ userId }),

      // 2. Low stock items (projection keeps payload small)
      db.collection("inventory")
        .find({ userId, quantity: { $lt: 10 } })
        .project({ _id: 1, name: 1, quantity: 1 })
        .toArray(),

      // 3. Invoice totals via aggregation (no need to load all docs into JS)
      db.collection("invoices").aggregate([
        { $match: { userId, deleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
            },
            unpaidInvoices: {
              $sum: { $cond: [{ $eq: ["$status", "unpaid"] }, 1, 0] },
            },
            totalCount: { $sum: 1 },
          },
        },
      ]).toArray(),

      // 4. Previous month inventory snapshot for trend calculation
      db.collection("inventory_history").findOne({
        userId,
        month: format(subMonths(new Date(), 1), 'yyyy-MM'),
      }),

      // 5. Previous month invoice snapshot for trend calculation
      db.collection("invoice_history").findOne({
        userId,
        month: format(subMonths(new Date(), 1), 'yyyy-MM'),
      }),

      // 6. Monthly revenue trend — one aggregation per month but all in parallel
      generateMonthlyRevenueTrend(db, userId, 6, monthOffset),

      // 7. Revenue by category
      calculateRevenueByCategory(db, userId),

      // 8. KPIs
      calculateKPIs(db, userId),
    ])

    // ─── Derive totals from aggregation result ────────────────────────────────
    const invoiceAgg = invoiceTotals[0] ?? { totalIncome: 0, unpaidInvoices: 0, totalCount: 0 }
    const totalIncome: number = invoiceAgg.totalIncome
    const unpaidInvoicesCount: number = invoiceAgg.unpaidInvoices

    // ─── Trend calculations ───────────────────────────────────────────────────
    const currentMonthRevenue = trendData[trendData.length - 1]?.value ?? 0
    const previousMonthRevenue = trendData[trendData.length - 2]?.value ?? 0
    const revenueTrend =
      previousMonthRevenue > 0
        ? parseFloat(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1))
        : null

    let inventoryTrend: number | null = null
    if (previousMonthInventoryData != null && previousMonthInventoryData.totalItems > 0) {
      inventoryTrend = parseFloat(
        ((totalItems - previousMonthInventoryData.totalItems) / previousMonthInventoryData.totalItems * 100).toFixed(1)
      )
    }

    let lowStockTrend: number | null = null
    if (previousMonthInventoryData != null && previousMonthInventoryData.lowStockCount !== undefined) {
      const prev = previousMonthInventoryData.lowStockCount
      if (prev > 0) {
        lowStockTrend = parseFloat(((lowStockItems.length - prev) / prev * 100).toFixed(1))
      } else if (prev === 0 && lowStockItems.length > 0) {
        lowStockTrend = 100
      } else {
        lowStockTrend = 0
      }
    }

    let unpaidInvoiceTrend: number | null = null
    if (previousMonthInvoiceData != null && previousMonthInvoiceData.unpaidCount !== undefined) {
      const prev = previousMonthInvoiceData.unpaidCount
      if (prev > 0) {
        unpaidInvoiceTrend = parseFloat(((unpaidInvoicesCount - prev) / prev * 100).toFixed(1))
      } else if (prev === 0 && unpaidInvoicesCount > 0) {
        unpaidInvoiceTrend = 100
      } else {
        unpaidInvoiceTrend = 0
      }
    }

    // ─── Fire-and-forget history upserts (don't block the response) ──────────
    const currentMonth = format(new Date(), 'yyyy-MM')
    Promise.all([
      db.collection("inventory_history").updateOne(
        { userId, month: currentMonth },
        { $set: { totalItems, lowStockCount: lowStockItems.length, updatedAt: new Date() } },
        { upsert: true }
      ),
      db.collection("invoice_history").updateOne(
        { userId, month: currentMonth },
        { $set: { totalInvoices: invoiceAgg.totalCount, unpaidCount: unpaidInvoicesCount, updatedAt: new Date() } },
        { upsert: true }
      ),
    ]).catch((err) => console.error("History upsert failed (non-critical):", err))

    // ─── Comparison data ──────────────────────────────────────────────────────
    const comparisonData = await getComparisonData(db, userId)

    return NextResponse.json(
      {
        totalItems,
        totalItemsTrend: inventoryTrend,
        lowStockItems,
        lowStockTrend,
        totalIncome,
        revenueTrend,
        unpaidInvoices: unpaidInvoicesCount,
        unpaidInvoicesTrend: unpaidInvoiceTrend,
        trendData,
        revenueByCategory,
        kpiData,
        ...comparisonData,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "An error occurred while fetching dashboard stats" }, { status: 500 })
  }
}

/**
 * Generate monthly revenue trend.
 * Runs all months in parallel (Promise.all) instead of sequentially.
 * Avoids $facet with hyphenated keys which MongoDB rejects.
 */
async function generateMonthlyRevenueTrend(db: any, userId: string, monthCount = 6, offset = 0) {
  const currentDate = new Date()

  const months = Array.from({ length: monthCount }, (_, i) => {
    const targetMonth = subMonths(currentDate, (monthCount - 1 - i) + offset)
    return {
      label: format(targetMonth, 'MMM yyyy'),
      start: startOfMonth(targetMonth),
      end: endOfMonth(targetMonth),
    }
  })

  // Run all months in parallel — each is a cheap indexed aggregation
  const results = await Promise.all(
    months.map((m) =>
      db.collection("invoices").aggregate([
        {
          $match: {
            userId,
            status: "paid",
            deleted: { $ne: true },
            createdAt: { $gte: m.start, $lte: m.end },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray()
    )
  )

  return months.map((m, i) => ({
    name: m.label,
    value: (results[i][0]?.total as number) ?? 0,
  }))
}

/**
 * Revenue distribution by product category.
 * Items are embedded in invoices (invoice.items), so we aggregate
 * directly from invoices — no separate invoice_items collection needed.
 */
async function calculateRevenueByCategory(db: any, userId: string) {
  // Fetch paid invoices and group revenue by categoryId via the embedded items array
  const result = await db.collection("invoices").aggregate([
    { $match: { userId, status: "paid", deleted: { $ne: true } } },
    { $unwind: "$items" },
    // Join inventory to get the categoryId for each line item
    {
      $lookup: {
        from: "inventory",
        localField: "items.itemId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: false } },
    // Only items that belong to a category
    { $match: { "product.categoryId": { $exists: true } } },
    // Join categories
    {
      $lookup: {
        from: "inventory_categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: false } },
    // Group by category and sum revenue
    {
      $group: {
        _id: "$category._id",
        name: { $first: "$category.name" },
        value: {
          $sum: {
            $multiply: [
              { $ifNull: ["$items.adjustedPrice", "$items.price"] },
              "$items.quantity",
            ],
          },
        },
      },
    },
    { $project: { _id: 0, name: 1, value: 1 } },
  ]).toArray()

  if (result.length === 0) {
    // Fallback: derive placeholder split from total paid income
    const [agg] = await db.collection("invoices").aggregate([
      { $match: { userId, status: "paid", deleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray()
    const total = agg?.total ?? 0
    return [
      { name: 'Category A', value: total * 0.4 },
      { name: 'Category B', value: total * 0.3 },
      { name: 'Category C', value: total * 0.2 },
      { name: 'Category D', value: total * 0.1 },
    ]
  }

  return result
}

/**
 * Calculate business KPIs using targeted aggregations.
 */
async function calculateKPIs(db: any, userId: string) {
  const [salesAgg, inventoryAgg, annualTarget, revAgg, invoiceCountAgg, warehouseCapacity] = await Promise.all([
    db.collection("sales").aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]).toArray(),

    db.collection("inventory").aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]).toArray(),

    db.collection("business_targets").findOne({
      userId,
      targetType: "revenue",
      year: new Date().getFullYear(),
    }),

    db.collection("invoices").aggregate([
      { $match: { userId, status: "paid", deleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray(),

    db.collection("invoices").aggregate([
      { $match: { userId, deleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          all: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        },
      },
    ]).toArray(),

    db.collection("warehouse_settings").findOne({ userId }),
  ])

  const totalSold: number = salesAgg[0]?.total ?? 0
  const totalInventory: number = inventoryAgg[0]?.total ?? 0
  const totalRevenue: number = revAgg[0]?.total ?? 0
  const allInvoices: number = invoiceCountAgg[0]?.all ?? 0
  const paidInvoices: number = invoiceCountAgg[0]?.paid ?? 0

  return {
    inventoryTurnover: Math.min(100, Math.round(totalInventory ? (totalSold / totalInventory * 100) : 0)),
    revenueTarget: Math.min(100, Math.round(annualTarget?.amount ? (totalRevenue / annualTarget.amount * 100) : 0)),
    invoiceCollection: Math.min(100, Math.round(allInvoices ? (paidInvoices / allInvoices * 100) : 0)),
    stockCapacity: Math.min(100, Math.round(warehouseCapacity?.capacity ? (totalInventory / warehouseCapacity.capacity * 100) : 0)),
  }
}

/**
 * Comparison data: fast/slow-moving items, stock value, avg sale, collection rate.
 * Reads invoice items from the embedded invoice.items array (not a separate collection).
 */
async function getComparisonData(db: any, userId: string) {
  const [salesByProduct, inventory, invoiceStats] = await Promise.all([
    // Aggregate sales per product from embedded invoice items
    db.collection("invoices").aggregate([
      { $match: { userId, deleted: { $ne: true } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.adjustedPrice", "$items.price"] },
                "$items.quantity",
              ],
            },
          },
        },
      },
    ]).toArray(),

    // Full inventory for slow-moving detection and stock value
    db.collection("inventory").find({ userId }).toArray(),

    // Invoice-level stats (avg sale value, collection rate)
    db.collection("invoices").aggregate([
      { $match: { userId, deleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        },
      },
    ]).toArray(),
  ])

  const itemsWithSales = salesByProduct
    .map((item: any) => {
      const inventoryItem = inventory.find(
        (inv: any) => inv._id.toString() === item._id?.toString()
      )
      if (!inventoryItem) return null
      return {
        _id: item._id,
        name: inventoryItem.name,
        quantity: inventoryItem.quantity,
        soldQuantity: item.totalQuantity,
        revenue: item.totalRevenue,
      }
    })
    .filter(Boolean)

  const fastMovingItems = [...itemsWithSales]
    .sort((a: any, b: any) => b.soldQuantity - a.soldQuantity)
    .slice(0, 5)

  const soldProductIds = new Set(salesByProduct.map((item: any) => item._id?.toString()))
  const slowMovingItems = inventory
    .filter((item: any) =>
      !soldProductIds.has(item._id.toString()) ||
      (itemsWithSales.find((s: any) => s._id?.toString() === item._id.toString())?.soldQuantity ?? 0) < 5
    )
    .map((item: any) => {
      const sales = itemsWithSales.find((s: any) => s._id?.toString() === item._id.toString())
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        _id: item._id,
        name: item.name,
        quantity: item.quantity,
        soldQuantity: sales?.soldQuantity ?? 0,
        daysInStock: daysSinceUpdate,
      }
    })
    .sort((a: any, b: any) => a.soldQuantity - b.soldQuantity)
    .slice(0, 5)

  const stockValue = inventory.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.price),
    0
  )
  const stats = invoiceStats[0] ?? { totalCount: 0, totalRevenue: 0, paidCount: 0 }
  const avgSaleValue = stats.totalCount > 0 ? stats.totalRevenue / stats.totalCount : 0
  const collectionRate = stats.totalCount > 0 ? (stats.paidCount / stats.totalCount) * 100 : 0

  return { fastMovingItems, slowMovingItems, stockValue, avgSaleValue, collectionRate }
}