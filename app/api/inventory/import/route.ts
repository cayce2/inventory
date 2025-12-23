import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must contain headers and at least one data row" }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const expectedHeaders = ['Name', 'SKU', 'Quantity', 'Price', 'Low Stock Threshold']
    
    if (!expectedHeaders.every(h => headers.includes(h))) {
      return NextResponse.json({ 
        error: "CSV must contain columns: Name, SKU, Quantity, Price, Low Stock Threshold" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const items = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      
      if (values.length !== headers.length) continue

      const item = {
        name: values[headers.indexOf('Name')],
        sku: values[headers.indexOf('SKU')].toUpperCase(),
        quantity: parseInt(values[headers.indexOf('Quantity')]),
        price: parseFloat(values[headers.indexOf('Price')]),
        lowStockThreshold: parseInt(values[headers.indexOf('Low Stock Threshold')])
      }

      if (!item.name || !item.sku || isNaN(item.quantity) || isNaN(item.price) || isNaN(item.lowStockThreshold)) {
        errors.push(`Row ${i + 1}: Invalid data`)
        continue
      }

      // Check for duplicate SKU
      const existingSku = await db.collection("inventory").findOne({ userId, sku: item.sku })
      if (existingSku) {
        errors.push(`Row ${i + 1}: SKU ${item.sku} already exists`)
        continue
      }

      items.push({
        ...item,
        userId,
        image: "", // Default empty image
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    if (items.length > 0) {
      await db.collection("inventory").insertMany(items)
    }

    return NextResponse.json({
      message: `Successfully imported ${items.length} items`,
      imported: items.length,
      errors: errors
    }, { status: 200 })

  } catch (error) {
    console.error("Error importing inventory:", error)
    return NextResponse.json({ error: "An error occurred while importing inventory" }, { status: 500 })
  }
}