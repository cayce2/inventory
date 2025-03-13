/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import * as XLSX from "xlsx"
import { ObjectId } from "mongodb"
import { reportPeriodSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse URL to get query parameters
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "all"
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Validate date formats if provided
    if (startDate && endDate) {
      if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        console.error("Invalid date format:", { startDate, endDate })
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
      }
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Determine date range
    const now = new Date()
    let dateFilter: any = {}

    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"), // Include the entire end date
      }
    } else if (period) {
      // Predefined periods
      switch (period) {
        case "day":
          dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) }
          break
        case "week":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0)
          dateFilter = { $gte: weekStart }
          break
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = { $gte: monthStart }
          break
        case "quarter":
          const quarterStart = new Date(now)
          quarterStart.setMonth(now.getMonth() - 3)
          dateFilter = { $gte: quarterStart }
          break
        case "year":
          const yearStart = new Date(now.getFullYear(), 0, 1)
          dateFilter = { $gte: yearStart }
          break
        default: // "all" or invalid period
          dateFilter = {} // No date filter
      }
    }

    // Fetch all inventory items
    const inventory = await db.collection("inventory").find({ userId }).toArray()

    // Fetch invoices with date filter
    const invoiceQuery: any = { userId }
    if (Object.keys(dateFilter).length > 0) {
      invoiceQuery.createdAt = dateFilter
    }
    const invoices = await db.collection("invoices").find(invoiceQuery).toArray()

    // Calculate total income, unpaid invoice amount, and overdue invoices amount
    let totalIncome = 0
    let unpaidInvoiceAmount = 0
    let overdueInvoiceAmount = 0
    const unpaidInvoices = []

    for (const invoice of invoices) {
      if (invoice.status === "paid") {
        totalIncome += invoice.amount
      } else {
        unpaidInvoiceAmount += invoice.amount
        unpaidInvoices.push(invoice)
        if (new Date(invoice.dueDate) < now) {
          overdueInvoiceAmount += invoice.amount
        }
      }
    }

    // Fetch restock history with date filter
    const restockQuery: any = { userId: new ObjectId(userId) }
    if (Object.keys(dateFilter).length > 0) {
      restockQuery.date = dateFilter
    }
    console.log("Restock query:", JSON.stringify(restockQuery))
    const restockHistory = await db.collection("restockHistory").find(restockQuery).toArray()
    console.log(`Found ${restockHistory.length} restock history records`)

    // Create a worksheet for inventory
    const inventoryWs = XLSX.utils.json_to_sheet(
      inventory.map((item) => ({
        Name: item.name,
        Quantity: item.quantity,
        Price: item.price,
        "Low Stock Threshold": item.lowStockThreshold,
        "Total Value": item.quantity * item.price,
      })),
    )

    // Create a worksheet for financial summary
    const financialSummaryWs = XLSX.utils.json_to_sheet([
      { Metric: "Total Income", Amount: totalIncome },
      { Metric: "Unpaid Invoice Amount", Amount: unpaidInvoiceAmount },
      { Metric: "Overdue Invoice Amount", Amount: overdueInvoiceAmount },
    ])

    // Create a worksheet for unpaid invoices
    const unpaidInvoicesWs = XLSX.utils.json_to_sheet(
      unpaidInvoices.map((invoice) => ({
        "Invoice Number": invoice.invoiceNumber,
        "Customer Name": invoice.customerName,
        "Customer Phone": invoice.customerPhone,
        Amount: invoice.amount,
        "Due Date": new Date(invoice.dueDate).toLocaleDateString(),
        Status: new Date(invoice.dueDate) < now ? "Overdue" : "Unpaid",
        Items: invoice.items
          .map((item: { itemId: ObjectId; quantity: number }) => {
            const itemDetail = inventory.find((invItem) => invItem._id.toString() === item.itemId.toString())
            return `${itemDetail ? itemDetail.name : "Unknown"} (${item.quantity})`
          })
          .join(", "),
      })),
    )

    // Create a worksheet for restock history with more detailed information
    const restockHistoryWs = XLSX.utils.json_to_sheet(
      restockHistory.map((record) => {
        const item = inventory.find(
          (invItem) => invItem._id.toString() === (record.itemId ? record.itemId.toString() : ""),
        )
        return {
          "Item Name": item ? item.name : "Unknown",
          "Restock Quantity": record.quantity,
          "Restock Date": record.date ? new Date(record.date).toLocaleDateString() : "N/A",
          "Previous Quantity": record.previousQuantity !== undefined ? record.previousQuantity : "N/A",
          "New Quantity":
            record.previousQuantity !== undefined ? record.previousQuantity + record.quantity : record.quantity,
          "User ID": record.userId ? record.userId.toString() : "N/A",
          "Item ID": record.itemId ? record.itemId.toString() : "N/A",
        }
      }),
    )

    // Create a workbook and add the worksheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, inventoryWs, "Inventory Report")
    XLSX.utils.book_append_sheet(wb, financialSummaryWs, "Financial Summary")
    XLSX.utils.book_append_sheet(wb, unpaidInvoicesWs, "Unpaid Invoices")
    XLSX.utils.book_append_sheet(wb, restockHistoryWs, "Restock History")

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    // Set the appropriate headers for file download
    const headers = new Headers()
    headers.append("Content-Disposition", 'attachment; filename="inventory_report.xlsx"')
    headers.append("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: headers,
    })
  } catch (error) {
    console.error("Error generating report:", error)
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "An error occurred while generating the report",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      reportPeriodSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { period, customDateRange, startDate, endDate } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Determine date range
    const now = new Date()
    let dateFilter: any = {}

    if (customDateRange && startDate && endDate) {
      // Custom date range
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"), // Include the entire end date
      }
    } else if (period) {
      // Predefined periods
      switch (period) {
        case "day":
          dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) }
          break
        case "week":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0)
          dateFilter = { $gte: weekStart }
          break
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = { $gte: monthStart }
          break
        case "quarter":
          const quarterStart = new Date(now)
          quarterStart.setMonth(now.getMonth() - 3)
          dateFilter = { $gte: quarterStart }
          break
        case "year":
          const yearStart = new Date(now.getFullYear(), 0, 1)
          dateFilter = { $gte: yearStart }
          break
        default: // "all" or invalid period
          dateFilter = {} // No date filter
      }
    }

    // Fetch invoices with date filter
    const invoiceQuery: any = { userId }
    if (Object.keys(dateFilter).length > 0) {
      invoiceQuery.createdAt = dateFilter
    }
    const invoices = await db.collection("invoices").find(invoiceQuery).toArray()

    // Calculate total income, unpaid invoice amount, and overdue invoices amount
    let totalIncome = 0
    let unpaidInvoiceAmount = 0
    let overdueInvoiceAmount = 0
    const unpaidInvoices = []

    for (const invoice of invoices) {
      if (invoice.status === "paid") {
        totalIncome += invoice.amount
      } else {
        unpaidInvoiceAmount += invoice.amount
        unpaidInvoices.push(invoice)
        if (new Date(invoice.dueDate) < now) {
          overdueInvoiceAmount += invoice.amount
        }
      }
    }

    // Fetch restock history with date filter
    const restockQuery: any = { userId }
    if (Object.keys(dateFilter).length > 0) {
      restockQuery.date = dateFilter
    }
    const restockHistory = await db.collection("restockHistory").find(restockQuery).toArray()

    // Fetch item details for unpaid invoices and restock history
    const itemIds = new Set([
      ...unpaidInvoices.flatMap((invoice) => invoice.items.map((item: { itemId: ObjectId }) => item.itemId)),
      ...restockHistory.map((record) => record.itemId),
    ])
    const items = await db
      .collection("inventory")
      .find({ _id: { $in: Array.from(itemIds).map((id) => new ObjectId(id)) } })
      .toArray()

    const itemMap = new Map(items.map((item) => [item._id.toString(), item]))

    const unpaidInvoicesWithItems = unpaidInvoices.map((invoice) => ({
      ...invoice,
      items: invoice.items.map((item: { itemId: ObjectId; quantity: number }) => ({
        ...item,
        name: itemMap.get(item.itemId.toString())?.name || "Unknown",
      })),
    }))

    const restockHistoryWithItems = restockHistory.map((record) => ({
      ...record,
      itemName: itemMap.get(record.itemId.toString())?.name || "Unknown",
    }))

    return NextResponse.json(
      {
        totalIncome,
        unpaidInvoiceAmount,
        overdueInvoiceAmount,
        unpaidInvoices: unpaidInvoicesWithItems,
        restockHistory: restockHistoryWithItems,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching report data:", error)
    return NextResponse.json({ error: "An error occurred while fetching report data" }, { status: 500 })
  }
}

