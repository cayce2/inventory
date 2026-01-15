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

    // Basic inventory stats
    const totalItems = await db.collection("inventory").countDocuments({ userId })
    const lowStockItems = await db
      .collection("inventory")
      .find({
        userId,
        quantity: { $lt: 10 }, // Updated threshold to match dashboard
      })
      .project({
        _id: 1,
        name: 1,
        quantity: 1,
      })
      .toArray()

    // Invoice data - excluding deleted invoices
    const invoices = await db.collection("invoices").find({ 
      userId, 
      deleted: { $ne: true } // Exclude deleted invoices
    }).toArray()
    
    const totalIncome = invoices.reduce((sum, invoice) => sum + (invoice.status === "paid" ? invoice.amount : 0), 0)
    const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid").length

    // Generate trend data for the past 6 months with offset
    const trendData = await generateMonthlyRevenueTrend(db, userId, 6, monthOffset)

    // Calculate trends safely, handling missing data for new accounts
    
    // 1. Revenue trend calculation
    const currentMonthRevenue = trendData[trendData.length - 1]?.value || 0
    const previousMonthRevenue = trendData[trendData.length - 2]?.value || 0
    let revenueTrend = null
    
    if (previousMonthRevenue > 0) {
      revenueTrend = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    }
    
    // 2. Get previous month's inventory count for trend calculation
    const previousMonthDate = subMonths(new Date(), 1)
    const previousMonthInventoryData = await db.collection("inventory_history").findOne({
      userId,
      month: format(previousMonthDate, 'yyyy-MM')
    })
    
    let inventoryTrend = null
    
    if (previousMonthInventoryData && previousMonthInventoryData.totalItems > 0) {
      inventoryTrend = ((totalItems - previousMonthInventoryData.totalItems) / previousMonthInventoryData.totalItems) * 100
    }
    
    // 3. Calculate low stock trend
    let lowStockTrend = null
    
    if (previousMonthInventoryData && previousMonthInventoryData.lowStockCount !== undefined) {
      if (previousMonthInventoryData.lowStockCount > 0) {
        lowStockTrend = ((lowStockItems.length - previousMonthInventoryData.lowStockCount) / previousMonthInventoryData.lowStockCount) * 100
      } else if (previousMonthInventoryData.lowStockCount === 0 && lowStockItems.length > 0) {
        // If there were no low stock items before but now there are, show as 100% increase
        lowStockTrend = 100
      } else if (previousMonthInventoryData.lowStockCount === 0 && lowStockItems.length === 0) {
        // If there were no low stock items before and none now, show as 0% change
        lowStockTrend = 0
      }
    }
    
    // 4. Calculate unpaid invoice trend
    const previousMonthInvoiceData = await db.collection("invoice_history").findOne({
      userId,
      month: format(previousMonthDate, 'yyyy-MM')
    })
    
    let unpaidInvoiceTrend = null
    
    if (previousMonthInvoiceData && previousMonthInvoiceData.unpaidCount !== undefined) {
      if (previousMonthInvoiceData.unpaidCount > 0) {
        unpaidInvoiceTrend = ((unpaidInvoices - previousMonthInvoiceData.unpaidCount) / previousMonthInvoiceData.unpaidCount) * 100
      } else if (previousMonthInvoiceData.unpaidCount === 0 && unpaidInvoices > 0) {
        // If there were no unpaid invoices before but now there are, show as 100% increase
        unpaidInvoiceTrend = 100
      } else if (previousMonthInvoiceData.unpaidCount === 0 && unpaidInvoices === 0) {
        // If there were no unpaid invoices before and none now, show as 0% change
        unpaidInvoiceTrend = 0
      }
    }
    
    // Store current month's data for future trend calculations
    const currentMonth = format(new Date(), 'yyyy-MM')
    
    // Create/update inventory history for current month
    await db.collection("inventory_history").updateOne(
      { userId, month: currentMonth },
      { 
        $set: { 
          totalItems,
          lowStockCount: lowStockItems.length,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    // Create/update invoice history for current month
    await db.collection("invoice_history").updateOne(
      { userId, month: currentMonth },
      { 
        $set: { 
          totalInvoices: invoices.length,
          unpaidCount: unpaidInvoices,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    // Get revenue by category for the distribution chart
    const categories = await db.collection("inventory_categories").find({ userId }).toArray()
    const revenueByCategory = await calculateRevenueByCategory(db, userId, categories)

    // Get KPI data
    const kpiData = await calculateKPIs(db, userId)

    // Get comparison data
    const comparisonData = await getComparisonData(db, userId, invoices)

    return NextResponse.json(
      {
        // Basic stats with trend data
        totalItems,
        totalItemsTrend: inventoryTrend !== null ? parseFloat(inventoryTrend.toFixed(1)) : null,
        lowStockItems,
        lowStockTrend: lowStockTrend !== null ? parseFloat(lowStockTrend.toFixed(1)) : null,
        totalIncome,
        revenueTrend: revenueTrend !== null ? parseFloat(revenueTrend.toFixed(1)) : null,
        unpaidInvoices,
        unpaidInvoicesTrend: unpaidInvoiceTrend !== null ? parseFloat(unpaidInvoiceTrend.toFixed(1)) : null,
        
        // Chart data
        trendData,
        revenueByCategory,
        
        // KPI data
        kpiData,
        
        // Comparison data
        ...comparisonData,
        
        // Last updated timestamp
        lastUpdated: new Date().toISOString()
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "An error occurred while fetching dashboard stats" }, { status: 500 })
  }
}

/**
 * Generate monthly revenue trend data for the specified number of months
 */
async function generateMonthlyRevenueTrend(db: any, userId: string, monthCount = 6, offset = 0) {
  const trendData = []
  const currentDate = new Date()
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const targetMonth = subMonths(currentDate, i + offset)
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)
    
    const monthlyInvoices = await db.collection("invoices").find({
      userId,
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd
      },
      status: "paid",
      deleted: { $ne: true } // Exclude deleted invoices
    }).toArray()
    
    const monthlyRevenue = monthlyInvoices.reduce((sum: number, invoice: { amount: number }) => sum + invoice.amount, 0)
    
    trendData.push({
      name: format(targetMonth, 'MMM yyyy'),
      value: monthlyRevenue
    })
  }
  
  return trendData
}

/**
 * Calculate revenue distribution by product category
 */
async function calculateRevenueByCategory(db: any, userId: string, categories: any[]) {
  const categoryRevenueData = []
  
  // First, get all non-deleted invoices to find relevant invoice items
  const validInvoices = await db.collection("invoices").find({
    userId,
    deleted: { $ne: true }
  }).toArray()
  
  const validInvoiceIds = validInvoices.map((invoice: { _id: any }) => invoice._id)
  
  for (const category of categories) {
    // Get all products in this category
    const products = await db.collection("inventory").find({
      userId,
      categoryId: category._id
    }).toArray()
    
    const productIds = products.map((product: { _id: any }) => product._id)
    
    // Calculate revenue from invoice items matching these products and from non-deleted invoices
    const invoiceItems = await db.collection("invoice_items").find({
      userId,
      productId: { $in: productIds },
      invoiceId: { $in: validInvoiceIds } // Only include items from non-deleted invoices
    }).toArray()
    
    const categoryRevenue = invoiceItems.reduce((sum: number, item: { price: number, quantity: number }) => sum + (item.price * item.quantity), 0)
    
    categoryRevenueData.push({
      name: category.name,
      value: categoryRevenue
    })
  }
  
  // If no categories found, create sample data
  if (categoryRevenueData.length === 0) {
    const totalIncome = await db.collection("invoices")
      .find({ userId, status: "paid", deleted: { $ne: true } })
      .toArray()
      .then((invoices: any[]) => invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0))
    
    return [
      { name: 'Category A', value: totalIncome * 0.4 },
      { name: 'Category B', value: totalIncome * 0.3 },
      { name: 'Category C', value: totalIncome * 0.2 },
      { name: 'Category D', value: totalIncome * 0.1 }
    ]
  }
  
  return categoryRevenueData
}

/**
 * Calculate business KPIs (Key Performance Indicators)
 */
async function calculateKPIs(db: any, userId: string) {
  // Inventory turnover
  const totalSold = await db.collection("sales").aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]).toArray().then((result: { total: number }[]) => result[0]?.total || 0)
  
  const totalInventory = await db.collection("inventory").aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]).toArray().then((result: { _id: null, total: number }[]) => result[0]?.total || 0)
  
  const inventoryTurnover = totalInventory ? (totalSold / totalInventory * 100) : 0
  
  // Revenue target
  const annualTarget = await db.collection("business_targets").findOne({ 
    userId, 
    targetType: "revenue",
    year: new Date().getFullYear()
  })
  
  const totalRevenue = await db.collection("invoices")
    .find({ userId, status: "paid", deleted: { $ne: true } })
    .toArray()
    .then((invoices: any[]) => invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0))
  
  const revenueTarget = annualTarget?.amount ? (totalRevenue / annualTarget.amount * 100) : 0
  
  // Invoice collection
  const allInvoices = await db.collection("invoices").countDocuments({ userId, deleted: { $ne: true } })
  const paidInvoices = await db.collection("invoices").countDocuments({ userId, status: "paid", deleted: { $ne: true } })
  const invoiceCollection = allInvoices ? (paidInvoices / allInvoices * 100) : 0
  
  // Stock capacity
  const warehouseCapacity = await db.collection("warehouse_settings").findOne({ userId })
  const stockCapacity = warehouseCapacity?.capacity ? (totalInventory / warehouseCapacity.capacity * 100) : 0
  
  return {
    inventoryTurnover: Math.min(100, Math.round(inventoryTurnover || 0)),
    revenueTarget: Math.min(100, Math.round(revenueTarget || 0)),
    invoiceCollection: Math.min(100, Math.round(invoiceCollection || 0)),
    stockCapacity: Math.min(100, Math.round(stockCapacity || 0))
  }
}

/**
 * Get comparison data for fast/slow moving items and analytics
 */
async function getComparisonData(db: any, userId: string, invoices: any[]) {
  const validInvoiceIds = invoices.map((inv: any) => inv._id)
  
  // Get all invoice items with product details
  const invoiceItems = await db.collection("invoice_items").aggregate([
    { $match: { userId, invoiceId: { $in: validInvoiceIds } } },
    { $group: {
      _id: "$productId",
      totalQuantity: { $sum: "$quantity" },
      totalRevenue: { $sum: { $multiply: ["$quantity", "$price"] } }
    }}
  ]).toArray()
  
  // Get inventory items
  const inventory = await db.collection("inventory").find({ userId }).toArray()
  
  // Calculate fast moving items
  const itemsWithSales = invoiceItems.map((item: any) => {
    const inventoryItem = inventory.find((inv: any) => inv._id.toString() === item._id?.toString())
    return {
      _id: item._id,
      name: inventoryItem?.name || "Unknown",
      quantity: inventoryItem?.quantity || 0,
      soldQuantity: item.totalQuantity,
      revenue: item.totalRevenue
    }
  }).filter((item: any) => item.name !== "Unknown")
  
  const fastMovingItems = itemsWithSales
    .sort((a: any, b: any) => b.soldQuantity - a.soldQuantity)
    .slice(0, 5)
  
  // Calculate slow moving items (items with low or no sales)
  const soldProductIds = new Set(invoiceItems.map((item: any) => item._id?.toString()))
  const slowMovingItems = inventory
    .filter((item: any) => !soldProductIds.has(item._id.toString()) || 
      (itemsWithSales.find((s: any) => s._id?.toString() === item._id.toString())?.soldQuantity || 0) < 5)
    .map((item: any) => {
      const sales = itemsWithSales.find((s: any) => s._id?.toString() === item._id.toString())
      const daysSinceUpdate = Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      return {
        _id: item._id,
        name: item.name,
        quantity: item.quantity,
        soldQuantity: sales?.soldQuantity || 0,
        daysInStock: daysSinceUpdate
      }
    })
    .sort((a: any, b: any) => a.soldQuantity - b.soldQuantity)
    .slice(0, 5)
  
  // Calculate stock value
  const stockValue = inventory.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
  
  // Calculate average sale value
  const totalInvoiceCount = invoices.length
  const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.status === "paid" ? inv.amount : 0), 0)
  const avgSaleValue = totalInvoiceCount > 0 ? totalRevenue / totalInvoiceCount : 0
  
  // Calculate collection rate
  const paidInvoices = invoices.filter((inv: any) => inv.status === "paid").length
  const collectionRate = totalInvoiceCount > 0 ? (paidInvoices / totalInvoiceCount) * 100 : 0
  
  return {
    fastMovingItems,
    slowMovingItems,
    stockValue,
    avgSaleValue,
    collectionRate
  }
}