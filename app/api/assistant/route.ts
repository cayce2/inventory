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
import clientPromise from "@/lib/mongodb"
import { inventoryItemSchema } from "@/lib/validations"
import sharp from "sharp"
import { ObjectId } from "mongodb"

function detectIntent(message: string) {
  const text = message.toLowerCase()

  if (/^(confirm|cancel)\b/.test(text)) return "confirm"
  if (/(create|generate|make|issue)\s+invoice/.test(text)) return "create-invoice"
  if (/(add|create|new)\s+(product|item|inventory)/.test(text)) return "add-item"
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

function parseConfirmCommand(message: string) {
  const match = message.trim().match(/^(confirm|cancel)\s+([a-f0-9]{24})/i)
  if (!match) return null
  return { action: match[1].toLowerCase(), id: match[2] }
}

function parseNumber(value?: string | null) {
  if (!value) return null
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  if (!match) return null
  return Number.parseFloat(match[0])
}

function extractAddItemDetails(message: string) {
  const nameMatch =
    message.match(/(?:called|named)\s+([a-z0-9\-_ ]+)/i) ||
    message.match(/add\s+(?:a|an|new)?\s*product\s+([a-z0-9\-_ ]+)/i) ||
    message.match(/add\s+(?:a|an|new)?\s*item\s+([a-z0-9\-_ ]+)/i)

  const quantityMatch =
    message.match(/stock level is\s*([0-9.,]+)/i) ||
    message.match(/stock is\s*([0-9.,]+)/i) ||
    message.match(/quantity is\s*([0-9.,]+)/i)

  const priceMatch =
    message.match(/cost is\s*([0-9.,]+)/i) ||
    message.match(/price is\s*([0-9.,]+)/i) ||
    message.match(/([0-9.,]+)\s*(kes|ksh)/i)

  const thresholdMatch =
    message.match(/threshold (?:for )?low stock is\s*([0-9.,]+)/i) ||
    message.match(/low stock threshold is\s*([0-9.,]+)/i) ||
    message.match(/threshold is\s*([0-9.,]+)/i)

  const name = nameMatch ? nameMatch[1].trim() : null
  const quantity = parseNumber(quantityMatch?.[1])
  const price = parseNumber(priceMatch?.[1])
  const lowStockThreshold = parseNumber(thresholdMatch?.[1])

  return { name, quantity, price, lowStockThreshold }
}

function generateSku(name: string) {
  const prefix = name.replace(/[^a-z0-9]/gi, "").substring(0, 3).toUpperCase() || "PRD"
  const stamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${stamp}-${random}`
}

function generateInvoiceNumber(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `INV-${day}-${rand}`
}

function extractLineItems(message: string) {
  const items: Array<{ token: string; quantity: number; explicitSku: boolean }> = []
  const quotedRegex = /(\d+)\s*x?\s*(?:units|items|products|pcs|pieces)?\s*(?:of\s+)?["']([^"']+)["']/gi
  const skuRegex = /(\d+)\s*x?\s*(?:units|items|products|pcs|pieces)?\s*(?:of\s+)?sku\s*[:#]?\s*([a-z0-9\-_]+)/gi
  const simpleRegex = /(\d+)\s*x?\s*(?:units|items|products|pcs|pieces)?\s*(?:of\s+)?([a-z0-9\-_]+)/gi

  let match: RegExpExecArray | null
  while ((match = skuRegex.exec(message)) !== null) {
    items.push({ token: match[2], quantity: Number.parseInt(match[1], 10), explicitSku: true })
  }

  while ((match = quotedRegex.exec(message)) !== null) {
    items.push({ token: match[2], quantity: Number.parseInt(match[1], 10), explicitSku: false })
  }

  while ((match = simpleRegex.exec(message)) !== null) {
    const token = match[2]
    if (items.some((item) => item.token.toLowerCase() === token.toLowerCase())) continue
    items.push({ token, quantity: Number.parseInt(match[1], 10), explicitSku: false })
  }

  return items.filter((item) => Number.isFinite(item.quantity) && item.quantity > 0)
}

function extractInvoiceDetails(message: string) {
  const sku = extractSkuCandidate(message)
  const quantityMatch =
    message.match(/(?:qty|quantity|units|unit|products|items)\s*(?:is|=|:)?\s*([0-9.,]+)/i) ||
    message.match(/for\s+([0-9.,]+)\s*(?:units|items|products)/i)
  const quantity = parseNumber(quantityMatch?.[1])

  const itemMatch =
    message.match(/item\s+(?:called|named)?\s*([a-z0-9\-_ ]+)/i) ||
    message.match(/product\s+(?:called|named)?\s*([a-z0-9\-_ ]+)/i)

  const customerMatch = message.match(/customer\s+(?:named\s+)?([a-z0-9 .'-]+)/i)
  const fallbackCustomerMatch =
    !customerMatch && message.match(/for\s+([a-z0-9 .'-]+)\s*(?:,|with|item|sku|$)/i)

  const phoneMatch = message.match(/phone\s*[:#]?\s*([+\d][\d\s\-()]+)/i)
  const dueDateMatch = message.match(/due\s*(?:date)?\s*([0-9\/-]+)/i)

  return {
    sku,
    quantity,
    itemName: itemMatch ? itemMatch[1].trim() : null,
    customerName: customerMatch ? customerMatch[1].trim() : fallbackCustomerMatch ? fallbackCustomerMatch[1].trim() : null,
    customerPhone: phoneMatch ? phoneMatch[1].trim() : null,
    dueDate: dueDateMatch ? dueDateMatch[1].trim() : null,
    lineItems: extractLineItems(message),
  }
}

function parseDueDate(input?: string | null) {
  if (!input) return null
  const parsed = new Date(input)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildPlaceholderImage(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "PR"

  const colors = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#F97316"]
  const color = colors[name.length % colors.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="48" fill="${color}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`
  const base64 = Buffer.from(svg).toString("base64")
  return `data:image/svg+xml;base64,${base64}`
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let message = ""
    let imageFile: File | null = null
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      message = String(formData.get("message") || "").trim()
      imageFile = (formData.get("image") as File | null) || null
    } else {
      const body = await req.json()
      message = String(body?.message || "").trim()
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const intent = detectIntent(message)

    if (intent === "confirm") {
      const command = parseConfirmCommand(message)
      if (!command) {
        return NextResponse.json(
          { response: "Please reply with \"confirm <id>\" or \"cancel <id>\"." },
          { status: 200 },
        )
      }

      const client = await clientPromise
      const db = client.db("inventory_management")
      const confirmation = await db.collection("assistant_confirmations").findOne({
        _id: new ObjectId(command.id),
        userId,
      })

      if (!confirmation) {
        return NextResponse.json(
          { response: "I couldn't find that confirmation. It may have expired." },
          { status: 200 },
        )
      }

      if (confirmation.expiresAt && new Date(confirmation.expiresAt) < new Date()) {
        await db.collection("assistant_confirmations").deleteOne({ _id: confirmation._id })
        return NextResponse.json(
          { response: "That confirmation has expired. Please create the request again." },
          { status: 200 },
        )
      }

      if (command.action === "cancel") {
        await db.collection("assistant_confirmations").deleteOne({ _id: confirmation._id })
        return NextResponse.json({ response: "Cancelled. Nothing was changed." }, { status: 200 })
      }

      if (confirmation.type !== "create-invoice") {
        await db.collection("assistant_confirmations").deleteOne({ _id: confirmation._id })
        return NextResponse.json({ response: "That confirmation is no longer valid." }, { status: 200 })
      }

      const payload = confirmation.payload as any
      const items = payload?.items || []

      if (!items.length) {
        await db.collection("assistant_confirmations").deleteOne({ _id: confirmation._id })
        return NextResponse.json({ response: "That confirmation is missing line items." }, { status: 200 })
      }

      const itemIds = items.map((item: any) => new ObjectId(item.itemId))
      const inventoryItems = await db
        .collection("inventory")
        .find({ _id: { $in: itemIds } })
        .toArray()

      const inventoryMap = new Map(inventoryItems.map((item: any) => [item._id.toString(), item]))
      const insufficient: string[] = []

      for (const item of items) {
        const inventoryItem = inventoryMap.get(item.itemId)
        if (!inventoryItem || inventoryItem.quantity < item.quantity) {
          insufficient.push(
            `${item.name} (${item.sku}) requested ${item.quantity}, available ${inventoryItem?.quantity ?? 0}`,
          )
        }
      }

      if (insufficient.length) {
        await db.collection("assistant_confirmations").deleteOne({ _id: confirmation._id })
        return NextResponse.json(
          {
            response: `Cannot create invoice due to insufficient stock: ${insufficient.join("; ")}.`,
          },
          { status: 200 },
        )
      }

      const invoiceNumber = generateInvoiceNumber()
      const amount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
      const dueDate = payload.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      const session = client.startSession()
      try {
        await session.withTransaction(async () => {
          await db.collection("invoices").insertOne(
            {
              userId,
              invoiceNumber,
              customerName: payload.customerName,
              customerPhone: payload.customerPhone || "",
              amount,
              dueDate,
              items: items.map((item: any) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                adjustedPrice: item.price,
              })),
              status: "unpaid",
              createdAt: new Date(),
              deleted: false,
            },
            { session },
          )

          for (const item of items) {
            await db
              .collection("inventory")
              .updateOne({ _id: new ObjectId(item.itemId) }, { $inc: { quantity: -item.quantity } }, { session })
          }
        })
        await session.endSession()
      } catch (error) {
        await session.endSession()
        throw error
      }

      await db.collection("assistant_confirmations").deleteOne({ _id: confirmation._id })

      return NextResponse.json(
        {
          response: `Invoice ${invoiceNumber} created for ${payload.customerName}. Total KES ${amount}. Due ${new Date(dueDate).toLocaleDateString("en-US")}.`,
          data: { invoiceNumber },
        },
        { status: 201 },
      )
    }

    if (intent === "create-invoice") {
      const details = extractInvoiceDetails(message)
      const missing: string[] = []
      if (!details.customerName) missing.push("customer name")
      if (!details.quantity && details.lineItems.length === 0) missing.push("quantity")
      if (!details.sku && !details.itemName && details.lineItems.length === 0) missing.push("item name or SKU")

      if (missing.length) {
        return NextResponse.json(
          {
            response: `I can create that invoice, but I need: ${missing.join(", ")}. Example: "Create invoice for customer John Doe for 10 units of SKU ABC123 due 2026-03-31."`,
          },
          { status: 200 },
        )
      }

      const client = await clientPromise
      const db = client.db("inventory_management")

      const inventory = await getInventoryItems(userId)

      const requestedItems =
        details.lineItems.length > 0
          ? details.lineItems
          : [
              {
                token: details.sku || details.itemName,
                quantity: details.quantity as number,
                explicitSku: Boolean(details.sku),
              },
            ]

      const resolvedItems: Array<{ itemId: string; name: string; sku: string; quantity: number; price: number }> = []
      const missingItems: string[] = []
      const ambiguousItems: string[] = []
      const insufficientItems: string[] = []

      for (const request of requestedItems) {
        const token = String(request.token || "").trim()
        if (!token) continue

        let matches = inventory.filter((item) =>
          request.explicitSku ? item.sku.toUpperCase() === token.toUpperCase() : false,
        )

        if (!matches.length) {
          matches = inventory.filter(
            (item) => item.sku.toUpperCase() === token.toUpperCase(),
          )
        }

        if (!matches.length) {
          const needle = token.toLowerCase()
          matches = inventory.filter((item) => item.name.toLowerCase().includes(needle))
        }

        if (!matches.length) {
          missingItems.push(token)
          continue
        }

        if (matches.length > 1) {
          ambiguousItems.push(token)
          continue
        }

        const item = matches[0]
        const quantity = Math.max(1, Math.floor(request.quantity))

        if (quantity > item.quantity) {
          insufficientItems.push(`${item.name} (${item.sku}) requested ${quantity}, available ${item.quantity}`)
          continue
        }

        resolvedItems.push({
          itemId: item._id,
          name: item.name,
          sku: item.sku,
          quantity,
          price: item.price,
        })
      }

      if (missingItems.length) {
        return NextResponse.json(
          { response: `I could not find: ${missingItems.join(", ")}. Please provide valid SKUs or item names.` },
          { status: 200 },
        )
      }

      if (ambiguousItems.length) {
        return NextResponse.json(
          { response: `Please specify SKUs for: ${ambiguousItems.join(", ")}.` },
          { status: 200 },
        )
      }

      if (!resolvedItems.length) {
        return NextResponse.json(
          { response: "I couldn't resolve any line items for this invoice." },
          { status: 200 },
        )
      }

      if (insufficientItems.length) {
        return NextResponse.json(
          { response: `Not enough stock for: ${insufficientItems.join("; ")}.` },
          { status: 200 },
        )
      }

      const dueDate = parseDueDate(details.dueDate) || (() => {
        const date = new Date()
        date.setDate(date.getDate() + 14)
        return date
      })()

      const amount = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const confirmation = await db.collection("assistant_confirmations").insertOne({
        userId,
        type: "create-invoice",
        payload: {
          customerName: details.customerName,
          customerPhone: details.customerPhone || "",
          dueDate: dueDate.toISOString().slice(0, 10),
          items: resolvedItems,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })

      const summary = resolvedItems
        .map((item) => `${item.quantity} x ${item.name} (${item.sku})`)
        .join(", ")

      return NextResponse.json(
        {
          response: `Ready to create invoice for ${details.customerName} (${details.customerPhone || "no phone"}). Items: ${summary}. Total KES ${amount}. Due ${dueDate.toLocaleDateString("en-US")}. Reply "confirm ${confirmation.insertedId}" to proceed or "cancel ${confirmation.insertedId}".`,
          data: { confirmationId: confirmation.insertedId.toString() },
        },
        { status: 200 },
      )
    }

    if (intent === "add-item") {
      const details = extractAddItemDetails(message)
      const missing: string[] = []
      if (!details.name) missing.push("product name")
      if (details.quantity === null) missing.push("stock level")
      if (details.price === null) missing.push("price")
      if (details.lowStockThreshold === null) missing.push("low stock threshold")

      if (missing.length) {
        return NextResponse.json(
          {
            response: `I can add that item, but I need: ${missing.join(", ")}. Example: "Add product called Bottle, stock level 30, price 5000 KES, low stock threshold 10."`,
          },
          { status: 200 },
        )
      }

      const client = await clientPromise
      const db = client.db("inventory_management")
      const baseSku = generateSku(details.name as string)

      const existingSku = await db.collection("inventory").findOne({
        userId,
        sku: baseSku,
      })

      const sku = existingSku ? generateSku(details.name as string) : baseSku

      const payload = {
        name: details.name as string,
        sku,
        quantity: Math.max(0, Math.floor(details.quantity as number)),
        price: Number(details.price),
        lowStockThreshold: Math.max(0, Math.floor(details.lowStockThreshold as number)),
      }

      try {
        inventoryItemSchema.parse(payload)
      } catch (validationError: any) {
        return NextResponse.json(
          {
            response: "I couldn't add that item. Please check the values and try again.",
            error: validationError.errors || validationError.message,
          },
          { status: 400 },
        )
      }

      let image: string | null = null
      let imageUrl: string | null = null

      if (imageFile) {
        const compressedImageBuffer = await sharp(await imageFile.arrayBuffer())
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()
        image = compressedImageBuffer.toString("base64")
      } else {
        imageUrl = buildPlaceholderImage(payload.name)
      }

      const result = await db.collection("inventory").insertOne({
        userId,
        ...payload,
        image,
        imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return NextResponse.json(
        {
          response: `Added ${payload.name} (SKU ${payload.sku}) with stock ${payload.quantity}, price KES ${payload.price}, low stock threshold ${payload.lowStockThreshold}. ${
            imageFile ? "Image attached." : "Generated a placeholder image."
          }`,
          data: { itemId: result.insertedId.toString(), item: payload },
        },
        { status: 201 },
      )
    }

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
          "I can help with stock checks, reorder suggestions, demand forecasts, invoice analysis, and invoice creation. Try: \"Create invoice for customer John Doe for 10 units of SKU ABC123\" or \"Show low stock items\".",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in assistant:", error)
    return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 })
  }
}
