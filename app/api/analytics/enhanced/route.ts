/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30days'

    const client = await clientPromise
    const db = client.db("inventory_management")

    const dateRange = getDateRange(period)
    const previousDateRange = getPreviousDateRange(period)

    // Fetch invoices for current and previous periods
    const [currentInvoices, previousInvoices, allInvoices] = await Promise.all([
      db.collection("invoices").find({ 
        userId, 
        deleted: { $ne: true },
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }).toArray(),
      db.collection("invoices").find({ 
        userId, 
        deleted: { $ne: true },
        createdAt: { $gte: previousDateRange.start, $lte: previousDateRange.end }
      }).toArray(),
      db.collection("invoices").find({ userId, deleted: { $ne: true } }).toArray()
    ])

    // Calculate profit margins
    const profitMetrics = await calculateProfitMetrics(db, userId, currentInvoices)
    const previousProfitMetrics = await calculateProfitMetrics(db, userId, previousInvoices)

    // Time-based trends
    const timeTrends = await calculateTimeTrends(db, userId, period)

    // Customer metrics
    const customerMetrics = await calculateCustomerMetrics(db, userId, currentInvoices, allInvoices)
    const previousCustomerMetrics = await calculateCustomerMetrics(db, userId, previousInvoices, allInvoices)

    // Sales velocity
    const salesVelocity = await calculateSalesVelocity(db, userId, currentInvoices)

    // Product mix analysis
    const productMix = await calculateProductMix(db, userId, currentInvoices)

    // Period comparisons
    const comparisons = calculatePeriodComparisons(
      profitMetrics, 
      previousProfitMetrics,
      customerMetrics,
      previousCustomerMetrics
    )

    return NextResponse.json({
      profitMetrics,
      timeTrends,
      customerMetrics,
      salesVelocity,
      productMix,
      comparisons,
      period
    })
  } catch (error) {
    console.error("Enhanced analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

function getDateRange(period: string) {
  const now = new Date()
  let start: Date
  
  switch (period) {
    case '7days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90days':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'thisMonth':
      start = startOfMonth(now)
      break
    case 'lastMonth':
      start = startOfMonth(subMonths(now, 1))
      return { start, end: endOfMonth(subMonths(now, 1)) }
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  return { start, end: now }
}

function getPreviousDateRange(period: string) {
  const now = new Date()
  let start: Date, end: Date
  
  switch (period) {
    case '7days':
      end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30days':
      end = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90days':
      end = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'thisMonth':
      start = startOfMonth(subMonths(now, 1))
      end = endOfMonth(subMonths(now, 1))
      break
    case 'lastMonth':
      start = startOfMonth(subMonths(now, 2))
      end = endOfMonth(subMonths(now, 2))
      break
    default:
      end = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  return { start, end }
}

async function calculateProfitMetrics(db: any, userId: string, invoices: any[]) {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const revenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  
  let totalCOGS = 0
  
  for (const invoice of paidInvoices) {
    for (const item of invoice.items) {
      const product = await db.collection("inventory").findOne({ _id: item.itemId, userId })
      const costPerUnit = product?.costPrice || product?.price * 0.6 || 0
      totalCOGS += costPerUnit * item.quantity
    }
  }
  
  const grossProfit = revenue - totalCOGS
  const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  
  return {
    revenue,
    cogs: totalCOGS,
    grossProfit,
    profitMargin,
    unitsSold: paidInvoices.reduce((sum, inv) => 
      sum + inv.items.reduce((s: number, i: any) => s + i.quantity, 0), 0)
  }
}

async function calculateTimeTrends(db: any, userId: string, period: string) {
  const days = period === '7days' ? 7 : period === '30days' ? 30 : 90
  const trends = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const dayInvoices = await db.collection("invoices").find({
      userId,
      status: 'paid',
      deleted: { $ne: true },
      createdAt: { $gte: dayStart, $lte: dayEnd }
    }).toArray()
    
    const revenue = dayInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0)
    const units = dayInvoices.reduce((sum: number, inv: any) => 
      sum + inv.items.reduce((s: number, i: any) => s + i.quantity, 0), 0)
    const aov = dayInvoices.length > 0 ? revenue / dayInvoices.length : 0
    
    trends.push({
      date: format(date, 'MMM dd'),
      revenue,
      units,
      aov,
      orders: dayInvoices.length
    })
  }
  
  return trends
}

async function calculateCustomerMetrics(db: any, userId: string, currentInvoices: any[], allInvoices: any[]) {
  const uniqueCustomers = new Set(currentInvoices.map(inv => inv.customerName || inv.customerId))
  const totalCustomers = uniqueCustomers.size
  
  const customerFirstPurchase = new Map()
  allInvoices.forEach(inv => {
    const customerId = inv.customerName || inv.customerId
    if (!customerFirstPurchase.has(customerId) || inv.createdAt < customerFirstPurchase.get(customerId)) {
      customerFirstPurchase.set(customerId, inv.createdAt)
    }
  })
  
  const periodStart = currentInvoices.length > 0 ? 
    Math.min(...currentInvoices.map(inv => inv.createdAt.getTime())) : Date.now()
  
  let newCustomers = 0
  currentInvoices.forEach(inv => {
    const customerId = inv.customerName || inv.customerId
    const firstPurchase = customerFirstPurchase.get(customerId)
    if (firstPurchase && firstPurchase.getTime() >= periodStart) {
      newCustomers++
    }
  })
  
  const returningCustomers = totalCustomers - newCustomers
  
  const totalRevenue = currentInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  const cac = newCustomers > 0 ? totalRevenue * 0.15 / newCustomers : 0
  const ltv = totalCustomers > 0 ? totalRevenue / totalCustomers * 3 : 0
  
  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    cac,
    ltv,
    avgOrderValue: currentInvoices.length > 0 ? totalRevenue / currentInvoices.length : 0
  }
}

async function calculateSalesVelocity(db: any, userId: string, invoices: any[]) {
  const inventory = await db.collection("inventory").find({ userId }).toArray()
  
  const itemSales = new Map()
  invoices.forEach(inv => {
    inv.items.forEach((item: any) => {
      const id = item.itemId.toString()
      itemSales.set(id, (itemSales.get(id) || 0) + item.quantity)
    })
  })
  
  const velocityData = inventory.map((item: any) => {
    const sold = itemSales.get(item._id.toString()) || 0
    const daysToSellout = item.quantity > 0 && sold > 0 ? 
      (item.quantity / sold) * 30 : 999
    
    return {
      _id: item._id,
      name: item.name,
      currentStock: item.quantity,
      soldLast30Days: sold,
      daysToSellout: Math.round(daysToSellout),
      turnoverRate: item.quantity > 0 ? (sold / item.quantity) * 100 : 0,
      velocity: sold > 10 ? 'Fast' : sold > 3 ? 'Medium' : 'Slow'
    }
  })
  
  return velocityData.sort((a: any, b: any) => b.soldLast30Days - a.soldLast30Days).slice(0, 10)
}

async function calculateProductMix(db: any, userId: string, invoices: any[]) {
  const categoryRevenue = new Map()
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  for (const invoice of invoices.filter(inv => inv.status === 'paid')) {
    for (const item of invoice.items) {
      const product = await db.collection("inventory").findOne({ _id: item.itemId, userId })
      const category = product?.category || 'Uncategorized'
      const itemRevenue = (item.adjustedPrice || item.price || 0) * item.quantity
      categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + itemRevenue)
    }
  }
  
  const mix = Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
    category,
    revenue,
    percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
  }))
  
  return mix.sort((a, b) => b.revenue - a.revenue)
}

function calculatePeriodComparisons(
  current: any, 
  previous: any,
  currentCustomer: any,
  previousCustomer: any
) {
  const revenueChange = previous.revenue > 0 ? 
    ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0
  
  const profitMarginChange = current.profitMargin - previous.profitMargin
  
  const unitsChange = previous.unitsSold > 0 ?
    ((current.unitsSold - previous.unitsSold) / previous.unitsSold) * 100 : 0
  
  const customerChange = previousCustomer.totalCustomers > 0 ?
    ((currentCustomer.totalCustomers - previousCustomer.totalCustomers) / previousCustomer.totalCustomers) * 100 : 0
  
  return {
    revenueChange,
    profitMarginChange,
    unitsChange,
    customerChange,
    status: revenueChange >= 0 ? 'positive' : 'negative'
  }
}
