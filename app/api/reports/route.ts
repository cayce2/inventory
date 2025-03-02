import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import * as XLSX from "xlsx"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Fetch all inventory items
    const inventory = await db.collection("inventory").find({ userId }).toArray()

    // Calculate total income for different time periods
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const invoices = await db
      .collection("invoices")
      .find({
        userId,
        status: "paid",
      })
      .toArray()

    const totalIncome = {
      day: invoices
        .filter((invoice) => new Date(invoice.createdAt) >= dayAgo)
        .reduce((sum, invoice) => sum + invoice.amount, 0),
      week: invoices
        .filter((invoice) => new Date(invoice.createdAt) >= weekAgo)
        .reduce((sum, invoice) => sum + invoice.amount, 0),
      month: invoices
        .filter((invoice) => new Date(invoice.createdAt) >= monthAgo)
        .reduce((sum, invoice) => sum + invoice.amount, 0),
      allTime: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    }

    // Fetch unpaid invoices with item details
    const unpaidInvoices = await db
      .collection("invoices")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            status: "unpaid",
          },
        },
        {
          $lookup: {
            from: "inventory",
            localField: "items.itemId",
            foreignField: "_id",
            as: "itemDetails",
          },
        },
      ])
      .toArray()

    // Fetch restock history with item details
    const restockHistory = await db
      .collection("restockHistory")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "inventory",
            localField: "itemId",
            foreignField: "_id",
            as: "itemDetails",
          },
        },
        {
          $addFields: {
            itemName: { $arrayElemAt: ["$itemDetails.name", 0] },
          },
        },
      ])
      .toArray()

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

    // Create a worksheet for total income
    const incomeWs = XLSX.utils.json_to_sheet([
      { Period: "Day", Income: totalIncome.day },
      { Period: "Week", Income: totalIncome.week },
      { Period: "Month", Income: totalIncome.month },
      { Period: "All Time", Income: totalIncome.allTime },
    ])

    // Create a worksheet for unpaid invoices
    const unpaidInvoicesWs = XLSX.utils.json_to_sheet(
      unpaidInvoices.map((invoice) => ({
        "Customer Name": invoice.customerName,
        "Customer Phone": invoice.customerPhone,
        "Invoice Number": invoice.invoiceNumber,
        Amount: invoice.amount,
        "Due Date": new Date(invoice.dueDate).toLocaleDateString(),
        Items: invoice.items
          .map((item: { itemId: ObjectId; quantity: number }) => {
            const itemDetail = invoice.itemDetails.find(
              (detail: { _id: ObjectId; name: string }) => detail._id.toString() === item.itemId.toString(),
            )
            return `${itemDetail ? itemDetail.name : "Unknown"} (${item.quantity})`
          })
          .join(", "),
      })),
    )

    // Create a worksheet for restock history
    const restockHistoryWs = XLSX.utils.json_to_sheet(
      restockHistory.map((record) => ({
        "Item Name": record.itemName || "Unknown",
        "Restock Quantity": record.quantity,
        "Restock Date": new Date(record.date).toLocaleDateString(),
        "Previous Quantity": record.previousQuantity !== undefined ? record.previousQuantity : "N/A",
        "New Quantity":
          record.previousQuantity !== undefined ? record.previousQuantity + record.quantity : record.quantity,
      })),
    )

    // Create a workbook and add the worksheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, inventoryWs, "Inventory Report")
    XLSX.utils.book_append_sheet(wb, incomeWs, "Total Income")
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
    return NextResponse.json({ error: "An error occurred while generating the report" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { period } = await req.json()

    const client = await clientPromise
    const db = client.db("inventory_management")

    const now = new Date()
    let startDate

    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "all":
        startDate = new Date(0) // Beginning of time
        break
      default:
        return NextResponse.json({ error: "Invalid period" }, { status: 400 })
    }

    const totalIncome = await db
      .collection("invoices")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            status: "paid",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    const unpaidInvoices = await db
      .collection("invoices")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            status: "unpaid",
          },
        },
        {
          $lookup: {
            from: "inventory",
            localField: "items.itemId",
            foreignField: "_id",
            as: "itemDetails",
          },
        },
      ])
      .toArray()

    return NextResponse.json(
      {
        totalIncome: totalIncome[0]?.total || 0,
        unpaidInvoices: unpaidInvoices.map((invoice) => ({
          ...invoice,
          items: invoice.items.map((item: { itemId: ObjectId; quantity: number }) => {
            const itemDetail = invoice.itemDetails.find(
              (detail: { _id: ObjectId; name: string }) => detail._id.toString() === item.itemId.toString(),
            )
            return {
              ...item,
              name: itemDetail ? itemDetail.name : "Unknown",
            }
          }),
        })),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching report data:", error)
    return NextResponse.json({ error: "An error occurred while fetching report data" }, { status: 500 })
  }
}

