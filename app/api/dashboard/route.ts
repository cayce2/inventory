/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Invoice data
    const invoices = await db.collection("invoices").find({ userId }).toArray()
    const totalIncome = invoices.reduce((sum, invoice) => sum + (invoice.status === "paid" ? invoice.amount : 0), 0)
    const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid").length

    // Generate trend data for the past 6 months
    const trendData = await generateMonthlyRevenueTrend(db, userId, 6)
    
    // Calculate month-over-month trends for stat cards
    const currentMonthRevenue = trendData[trendData.length - 1]?.value || 0
    const previousMonthRevenue = trendData[trendData.length - 2]?.value || 0
    const revenueTrend = previousMonthRevenue ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1) : '0'
    
    // Get previous month's inventory count for trend calculation
    const previousMonthDate = subMonths(new Date(), 1)
    const previousMonthItemCount = await db.collection("inventory_history").findOne({
      userId,
      month: format(previousMonthDate, 'yyyy-MM')
    })
    
    const inventoryTrend = previousMonthItemCount?.totalItems 
      ? ((totalItems - previousMonthItemCount.totalItems) / previousMonthItemCount.totalItems * 100).toFixed(1) 
      : '2.5' // Default value if no history

    // Calculate low stock trend
    const previousMonthLowStock = await db.collection("inventory_history").findOne({
      userId,
      month: format(previousMonthDate, 'yyyy-MM')
    })
    
    const lowStockTrend = previousMonthLowStock?.lowStockCount 
      ? ((lowStockItems.length - previousMonthLowStock.lowStockCount) / previousMonthLowStock.lowStockCount * 100).toFixed(1) 
      : '-1.8' // Default value if no history

    // Calculate unpaid invoice trend
    const previousMonthUnpaid = await db.collection("invoice_history").findOne({
      userId,
      month: format(previousMonthDate, 'yyyy-MM')
    })
    
    const unpaidTrend = previousMonthUnpaid?.unpaidCount 
      ? ((unpaidInvoices - previousMonthUnpaid.unpaidCount) / previousMonthUnpaid.unpaidCount * 100).toFixed(1) 
      : '-0.7' // Default value if no history

    // Get revenue by category for the distribution chart
    const categories = await db.collection("inventory_categories").find({ userId }).toArray()
    const revenueByCategory = await calculateRevenueByCategory(db, userId, categories)

    // Get KPI data
    const kpiData = await calculateKPIs(db, userId)

    return NextResponse.json(
      {
        // Basic stats with trend data
        totalItems,
        totalItemsTrend: parseFloat(inventoryTrend),
        lowStockItems,
        lowStockTrend: parseFloat(lowStockTrend),
        totalIncome,
        revenueTrend: parseFloat(revenueTrend),
        unpaidInvoices,
        unpaidInvoicesTrend: parseFloat(unpaidTrend),
        
        // Chart data
        trendData,
        revenueByCategory,
        
        // KPI data
        kpiData,
        
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
async function generateMonthlyRevenueTrend(db: any, userId: string, monthCount = 6) {
  const trendData = []
  const currentDate = new Date()
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const targetMonth = subMonths(currentDate, i)
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)
    
    const monthlyInvoices = await db.collection("invoices").find({
      userId,
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd
      },
      status: "paid"
    }).toArray()
    
    const monthlyRevenue = monthlyInvoices.reduce((sum: number, invoice: { amount: number }) => sum + invoice.amount, 0)
    
    trendData.push({
      name: format(targetMonth, 'MMM'),
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
  
  for (const category of categories) {
    // Get all products in this category
    const products = await db.collection("inventory").find({
      userId,
      categoryId: category._id
    }).toArray()
    
    const productIds = products.map((product: { _id: any }) => product._id)
    
    // Calculate revenue from invoice items matching these products
    const invoiceItems = await db.collection("invoice_items").find({
      userId,
      productId: { $in: productIds }
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
      .find({ userId, status: "paid" })
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
  
  const inventoryTurnover = totalInventory ? (totalSold / totalInventory * 100) : 78
  
  // Revenue target
  const annualTarget = await db.collection("business_targets").findOne({ 
    userId, 
    targetType: "revenue",
    year: new Date().getFullYear()
  })
  
  const totalRevenue = await db.collection("invoices")
    .find({ userId, status: "paid" })
    .toArray()
    .then((invoices: any[]) => invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0))
  
  const revenueTarget = annualTarget?.amount ? (totalRevenue / annualTarget.amount * 100) : 65
  
  // Invoice collection
  const allInvoices = await db.collection("invoices").countDocuments({ userId })
  const paidInvoices = await db.collection("invoices").countDocuments({ userId, status: "paid" })
  const invoiceCollection = allInvoices ? (paidInvoices / allInvoices * 100) : 92
  
  // Stock capacity
  const warehouseCapacity = await db.collection("warehouse_settings").findOne({ userId })
  const stockCapacity = warehouseCapacity?.capacity ? (totalInventory / warehouseCapacity.capacity * 100) : 43
  
  return {
    inventoryTurnover: Math.min(100, Math.round(inventoryTurnover)),
    revenueTarget: Math.min(100, Math.round(revenueTarget)),
    invoiceCollection: Math.min(100, Math.round(invoiceCollection)),
    stockCapacity: Math.min(100, Math.round(stockCapacity))
  }
}