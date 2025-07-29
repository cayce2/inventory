/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { skuLookupSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sku = searchParams.get("sku")

    if (!sku) {
      return NextResponse.json({ error: "SKU parameter is required" }, { status: 400 })
    }

    // Validate SKU format
    try {
      skuLookupSchema.parse({ sku })
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Invalid SKU format",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Look up item by SKU
    const item = await db.collection("inventory").findOne({ 
      userId, 
      sku: sku.toUpperCase() 
    })

    if (!item) {
      return NextResponse.json({ 
        exists: false, 
        message: "Item with this SKU not found" 
      }, { status: 200 })
    }

    return NextResponse.json({ 
      exists: true, 
      item: {
        _id: item._id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        lowStockThreshold: item.lowStockThreshold,
        imageUrl: item.imageUrl,
        image: item.image
      }
    }, { status: 200 })
  } catch (error) {
    console.error("Error looking up SKU:", error)
    return NextResponse.json({ error: "An error occurred while looking up the SKU" }, { status: 500 })
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
      skuLookupSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { sku } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if SKU already exists for this user
    const existingItem = await db.collection("inventory").findOne({ 
      userId, 
      sku: sku.toUpperCase() 
    })

    return NextResponse.json({ 
      available: !existingItem,
      exists: !!existingItem,
      item: existingItem ? {
        _id: existingItem._id,
        name: existingItem.name,
        sku: existingItem.sku,
        quantity: existingItem.quantity
      } : null
    }, { status: 200 })
  } catch (error) {
    console.error("Error checking SKU availability:", error)
    return NextResponse.json({ error: "An error occurred while checking SKU availability" }, { status: 500 })
  }
}