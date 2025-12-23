import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const inventory = await db.collection("inventory").find({ userId }).toArray()

    // Convert to CSV format
    const csvHeaders = "Name,SKU,Quantity,Price,Low Stock Threshold"
    const csvRows = inventory.map(item => 
      `"${item.name}","${item.sku}",${item.quantity},${item.price},${item.lowStockThreshold}`
    )
    const csvContent = [csvHeaders, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="inventory_export.csv"'
      }
    })
  } catch (error) {
    console.error("Error exporting inventory:", error)
    return NextResponse.json({ error: "An error occurred while exporting inventory" }, { status: 500 })
  }
}