/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "@/lib/auth-middleware"
import {
  getInventoryItems,
  getInvoiceAnomalies,
  getLowStockCounts,
  getReorderSuggestions,
  getSalesForecast,
} from "@/lib/assistant"

function detectIntent(message: string) {
  const text = message.toLowerCase()

  if (/(reorder|restock|re-stock|purchase order|po)/.test(text)) return "reorder"
  if (/(forecast|prediction|project|next month|demand)/.test(text)) return "forecast"
  if (/(invoice|pricing|price|anomal|undercharge|overcharge)/.test(text)) return "invoice"
  if (/(low stock|out of stock|stockout|stock alert)/.test(text)) return "low-stock"
  if (/(sku)/.test(text) || /(how many|quantity|stock level)/.test(text)) return "inventory"

  return "help"
}

function extractSkuCandidate(message: string) {
  const match = message.match(/sku\s*[:#]?\s*([a-z0-9\-_]+)/i)
  return match ? match[1].toUpperCase() : null
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const message = String(body?.message || "").trim()
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const intent = detectIntent(message)

    if (intent === "low-stock") {
      const { total, low, out, items } = await getLowStockCounts(userId)
      const response = total
        ? `You have ${total} low/out-of-stock item(s): ${low} low stock and ${out} out of stock.`
        : "All items are above their low stock thresholds."
      return NextResponse.json({ response, data: { items } }, { status: 200 })
    }

    if (intent === "reorder") {
      const suggestions = await getReorderSuggestions(userId)
      if (!suggestions.length) {
        return NextResponse.json(
          { response: "No reorder suggestions right now. Stock levels look healthy.", data: { suggestions } },
          { status: 200 },
        )
      }

      const top = suggestions.slice(0, 5)
      const response = `I found ${suggestions.length} item(s) below threshold. Top suggestions: ${top
        .map((item) => `${item.name} (${item.sku}) -> reorder ${item.reorderQuantity}`)
        .join(", ")}.`

      return NextResponse.json({ response, data: { suggestions } }, { status: 200 })
    }

    if (intent === "forecast") {
      const forecast = await getSalesForecast(userId)
      const response = forecast.months.length
        ? `Next month projection is ${forecast.projection.total} based on the last 3 months average (${forecast.averageMonthly}).`
        : "Not enough data to project next month yet."
      return NextResponse.json({ response, data: { forecast } }, { status: 200 })
    }

    if (intent === "invoice") {
      const anomalies = await getInvoiceAnomalies(userId)
      if (!anomalies.length) {
        return NextResponse.json(
          { response: "No pricing anomalies detected in recent invoices.", data: { anomalies } },
          { status: 200 },
        )
      }

      const top = anomalies.slice(0, 5)
      const response = `I flagged ${anomalies.length} pricing anomaly(s). Recent examples: ${top
        .map((item) => `Invoice ${item.invoiceNumber} - ${item.itemName}`)
        .join(", ")}.`
      return NextResponse.json({ response, data: { anomalies } }, { status: 200 })
    }

    if (intent === "inventory") {
      const inventory = await getInventoryItems(userId)
      const skuCandidate = extractSkuCandidate(message)

      let matches = inventory.filter((item) =>
        skuCandidate ? item.sku.toUpperCase() === skuCandidate : false,
      )

      if (!matches.length) {
        const text = message.toLowerCase()
        matches = inventory.filter(
          (item) =>
            text.includes(item.name.toLowerCase()) || text.includes(item.sku.toLowerCase()),
        )
      }

      if (!matches.length) {
        return NextResponse.json(
          {
            response:
              "I could not find a matching SKU or item name. Try asking like: \"How many units of SKU ABC123?\"",
            data: { items: [] },
          },
          { status: 200 },
        )
      }

      const response = matches
        .map(
          (item) =>
            `${item.name} (${item.sku}) has ${item.quantity} unit(s) in stock. Low stock threshold is ${item.lowStockThreshold}.`,
        )
        .join(" ")

      return NextResponse.json({ response, data: { items: matches } }, { status: 200 })
    }

    return NextResponse.json(
      {
        response:
          "I can help with stock checks, reorder suggestions, demand forecasts, and invoice analysis. Try: \"Show low stock items\", \"Reorder suggestions\", or \"Forecast next month sales.\"",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in assistant:", error)
    return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 })
  }
}
