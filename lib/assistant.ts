/* eslint-disable @typescript-eslint/no-explicit-any */
import clientPromise from "@/lib/mongodb"

const LEAD_TIME_MONTHS = 2
const SAFETY_STOCK_MULTIPLIER = 0.5
const REORDER_LOOKBACK_MONTHS = 3
const FORECAST_LOOKBACK_MONTHS = 6
const INVOICE_ANALYSIS_LOOKBACK_DAYS = 90
const PRICE_DROP_THRESHOLD = -0.15
const PRICE_SPIKE_THRESHOLD = 0.25

export interface InventoryItemSummary {
  _id: string
  name: string
  sku: string
  quantity: number
  lowStockThreshold: number
  price: number
}

export interface ReorderSuggestion {
  itemId: string
  name: string
  sku: string
  currentQuantity: number
  lowStockThreshold: number
  avgMonthlySales: number
  safetyStock: number
  leadTimeMonths: number
  reorderQuantity: number
}

export interface SalesForecast {
  months: Array<{ month: string; total: number }>
  projection: { month: string; total: number }
  averageMonthly: number
}

export interface InvoiceAnomaly {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  itemId: string
  itemName: string
  sku: string
  baselinePrice: number | null
  invoicePrice: number
  deviationPct: number | null
  reason: string
}

function toMonthKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  return `${year}-${month}`
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date)
}

export async function getInventoryItems(userId: string): Promise<InventoryItemSummary[]> {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const inventory = await db.collection("inventory").find({ userId }).toArray()
  return inventory.map((item: any) => ({
    _id: item._id.toString(),
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    lowStockThreshold: item.lowStockThreshold,
    price: item.price,
  }))
}

export async function getLowStockItems(userId: string): Promise<InventoryItemSummary[]> {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const lowStockItems = await db
    .collection("inventory")
    .find({
      userId,
      $or: [
        { quantity: { $lte: 0 } },
        { $expr: { $lt: ["$quantity", "$lowStockThreshold"] } },
      ],
    })
    .toArray()

  return lowStockItems.map((item: any) => ({
    _id: item._id.toString(),
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    lowStockThreshold: item.lowStockThreshold,
    price: item.price,
  }))
}

export async function getLowStockCounts(userId: string) {
  const items = await getLowStockItems(userId)
  const outOfStockCount = items.filter((item) => item.quantity <= 0).length
  const lowStockCount = items.filter((item) => item.quantity > 0).length
  return {
    total: items.length,
    low: lowStockCount,
    out: outOfStockCount,
    items,
  }
}

export async function getReorderSuggestions(userId: string): Promise<ReorderSuggestion[]> {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const inventory = await getInventoryItems(userId)
  const lowStockItems = inventory.filter((item) => item.quantity < item.lowStockThreshold)

  const since = new Date()
  since.setMonth(since.getMonth() - REORDER_LOOKBACK_MONTHS)

  const invoices = await db
    .collection("invoices")
    .find({ userId, deleted: { $ne: true }, createdAt: { $gte: since } })
    .toArray()

  const salesByItem = new Map<string, number>()
  for (const invoice of invoices) {
    const items = Array.isArray(invoice.items) ? invoice.items : []
    for (const item of items) {
      if (!item?.itemId) continue
      const itemId = String(item.itemId)
      const previous = salesByItem.get(itemId) || 0
      salesByItem.set(itemId, previous + Number(item.quantity || 0))
    }
  }

  return lowStockItems
    .map((item) => {
      const totalSold = salesByItem.get(item._id) || 0
      const avgMonthlySales = totalSold / REORDER_LOOKBACK_MONTHS
      const safetyStock = Math.ceil(avgMonthlySales * SAFETY_STOCK_MULTIPLIER)
      const target = avgMonthlySales * LEAD_TIME_MONTHS + safetyStock
      const reorderQuantity = Math.max(0, Math.ceil(target - item.quantity))

      return {
        itemId: item._id,
        name: item.name,
        sku: item.sku,
        currentQuantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        avgMonthlySales: Number(avgMonthlySales.toFixed(2)),
        safetyStock,
        leadTimeMonths: LEAD_TIME_MONTHS,
        reorderQuantity,
      }
    })
    .filter((suggestion) => suggestion.reorderQuantity > 0)
    .sort((a, b) => b.reorderQuantity - a.reorderQuantity)
}

export async function getSalesForecast(userId: string): Promise<SalesForecast> {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const start = new Date()
  start.setDate(1)
  start.setMonth(start.getMonth() - (FORECAST_LOOKBACK_MONTHS - 1))

  const invoices = await db
    .collection("invoices")
    .find({ userId, deleted: { $ne: true }, status: "paid", createdAt: { $gte: start } })
    .toArray()

  const totalsByMonth = new Map<string, number>()
  for (const invoice of invoices) {
    const createdAt = invoice.createdAt ? new Date(invoice.createdAt) : null
    if (!createdAt) continue
    const key = toMonthKey(createdAt)
    totalsByMonth.set(key, (totalsByMonth.get(key) || 0) + Number(invoice.amount || 0))
  }

  const months: Array<{ month: string; total: number }> = []
  const cursor = new Date(start)
  for (let i = 0; i < FORECAST_LOOKBACK_MONTHS; i += 1) {
    const key = toMonthKey(cursor)
    months.push({
      month: formatMonthLabel(cursor),
      total: Math.round(totalsByMonth.get(key) || 0),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const lastThree = months.slice(-3).map((entry) => entry.total)
  const averageMonthly = lastThree.length
    ? Math.round(lastThree.reduce((sum, value) => sum + value, 0) / lastThree.length)
    : 0

  const projectionDate = new Date()
  projectionDate.setDate(1)
  projectionDate.setMonth(projectionDate.getMonth() + 1)

  return {
    months,
    projection: {
      month: formatMonthLabel(projectionDate),
      total: averageMonthly,
    },
    averageMonthly,
  }
}

export async function getInvoiceAnomalies(userId: string): Promise<InvoiceAnomaly[]> {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const since = new Date()
  since.setDate(since.getDate() - INVOICE_ANALYSIS_LOOKBACK_DAYS)

  const invoices = await db
    .collection("invoices")
    .find({ userId, deleted: { $ne: true }, createdAt: { $gte: since } })
    .toArray()

  const inventory = await getInventoryItems(userId)
  const inventoryMap = new Map(inventory.map((item) => [item._id, item]))

  const anomalies: InvoiceAnomaly[] = []

  for (const invoice of invoices) {
    const items = Array.isArray(invoice.items) ? invoice.items : []
    for (const item of items) {
      if (!item?.itemId) continue
      const itemId = String(item.itemId)
      const inventoryItem = inventoryMap.get(itemId)
      const baselinePrice = inventoryItem?.price ?? null
      const invoicePrice = item.adjustedPrice !== undefined
        ? Number(item.adjustedPrice)
        : baselinePrice ?? 0

      if (!baselinePrice) {
        anomalies.push({
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber || "N/A",
          customerName: invoice.customerName || "Unknown",
          itemId,
          itemName: inventoryItem?.name || item.name || "Unknown item",
          sku: inventoryItem?.sku || "N/A",
          baselinePrice: null,
          invoicePrice,
          deviationPct: null,
          reason: "Missing baseline price for comparison",
        })
        continue
      }

      const deviationPct = baselinePrice ? (invoicePrice - baselinePrice) / baselinePrice : 0
      if (invoicePrice <= 0) {
        anomalies.push({
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber || "N/A",
          customerName: invoice.customerName || "Unknown",
          itemId,
          itemName: inventoryItem?.name || item.name || "Unknown item",
          sku: inventoryItem?.sku || "N/A",
          baselinePrice,
          invoicePrice,
          deviationPct,
          reason: "Invoice price is zero or negative",
        })
        continue
      }

      if (deviationPct <= PRICE_DROP_THRESHOLD || deviationPct >= PRICE_SPIKE_THRESHOLD) {
        anomalies.push({
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber || "N/A",
          customerName: invoice.customerName || "Unknown",
          itemId,
          itemName: inventoryItem?.name || item.name || "Unknown item",
          sku: inventoryItem?.sku || "N/A",
          baselinePrice,
          invoicePrice,
          deviationPct,
          reason:
            deviationPct <= PRICE_DROP_THRESHOLD
              ? "Invoice price is significantly below baseline"
              : "Invoice price is significantly above baseline",
        })
      }
    }
  }

  return anomalies
}
