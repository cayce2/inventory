/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import sharp from "sharp"
import { inventoryItemSchema, restockSchema, deleteItemSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const inventory = await db.collection("inventory").find({ userId }).toArray()
    return NextResponse.json(inventory, { status: 200 })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "An error occurred while fetching the inventory" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()

    // Extract and validate data
    const name = formData.get("name") as string
    const sku = formData.get("sku") as string
    const quantityStr = formData.get("quantity") as string
    const priceStr = formData.get("price") as string
    const lowStockThresholdStr = formData.get("lowStockThreshold") as string
    const imageFile = formData.get("image") as File

    // Convert string values to numbers
    const quantity = Number.parseInt(quantityStr, 10)
    const price = Number.parseFloat(priceStr)
    const lowStockThreshold = Number.parseInt(lowStockThresholdStr, 10)

    // Validate the data
    try {
      inventoryItemSchema.parse({
        name,
        sku,
        quantity,
        price,
        lowStockThreshold,
      })
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check for SKU uniqueness within user's inventory
    const existingSku = await db.collection("inventory").findOne({ 
      userId, 
      sku: sku.toUpperCase() 
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "SKU already exists in your inventory" }, 
        { status: 400 }
      )
    }

    if (!imageFile) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Compress and resize the image
    const compressedImageBuffer = await sharp(await imageFile.arrayBuffer())
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Convert the image to base64
    const base64Image = compressedImageBuffer.toString("base64")

    const result = await db.collection("inventory").insertOne({
      userId,
      name,
      sku: sku.toUpperCase(), // Store SKU in uppercase for consistency
      quantity,
      price,
      lowStockThreshold,
      image: base64Image,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ message: "Item added successfully", itemId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error adding item:", error)
    return NextResponse.json({ error: "An error occurred while adding the item" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()

    // Extract data
    const _id = formData.get("_id") as string
    const name = formData.get("name") as string
    const sku = formData.get("sku") as string
    const quantityStr = formData.get("quantity") as string
    const priceStr = formData.get("price") as string
    const lowStockThresholdStr = formData.get("lowStockThreshold") as string
    const imageFile = formData.get("image") as File | null

    // Convert string values to numbers
    const quantity = Number.parseInt(quantityStr, 10)
    const price = Number.parseFloat(priceStr)
    const lowStockThreshold = Number.parseInt(lowStockThresholdStr, 10)

    if (!_id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Validate ObjectId
    if (!ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid item ID format" }, { status: 400 })
    }

    // Validate the data
    try {
      inventoryItemSchema.parse({
        name,
        sku,
        quantity,
        price,
        lowStockThreshold,
      })
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check for SKU uniqueness (excluding current item)
    const existingSku = await db.collection("inventory").findOne({ 
      userId, 
      sku: sku.toUpperCase(),
      _id: { $ne: new ObjectId(_id) }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "SKU already exists in your inventory" }, 
        { status: 400 }
      )
    }

    const updateData: any = {
      name,
      sku: sku.toUpperCase(), // Store SKU in uppercase for consistency
      quantity,
      price,
      lowStockThreshold,
      updatedAt: new Date(),
    }

    if (imageFile) {
      // Compress and resize the image
      const compressedImageBuffer = await sharp(await imageFile.arrayBuffer())
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Convert the image to base64
      const base64Image = compressedImageBuffer.toString("base64")

      updateData.image = base64Image
    }

    const result = await db.collection("inventory").updateOne({ _id: new ObjectId(_id), userId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "An error occurred while updating the item" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      restockSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { itemId, quantity } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Get the current item to record the previous quantity
    const currentItem = await db.collection("inventory").findOne({ _id: new ObjectId(itemId), userId })

    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Update the item quantity and timestamp
    await db
      .collection("inventory")
      .updateOne({ _id: new ObjectId(itemId), userId }, { 
        $inc: { quantity: quantity },
        $set: { updatedAt: new Date() }
      })

    // Add a restock record with previous quantity
    const restockRecord = {
      itemId: new ObjectId(itemId),
      itemName: currentItem.name,
      itemSku: currentItem.sku,
      quantity,
      previousQuantity: currentItem.quantity,
      newQuantity: currentItem.quantity + quantity,
      date: new Date(),
      userId: new ObjectId(userId),
    }

    await db.collection("restockHistory").insertOne(restockRecord)

    return NextResponse.json({ message: "Item restocked successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error restocking item:", error)
    return NextResponse.json({ error: "An error occurred while restocking the item" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      deleteItemSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 },
      )
    }

    const { itemId } = data

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("inventory").deleteOne({ _id: new ObjectId(itemId), userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "An error occurred while deleting the item" }, { status: 500 })
  }
}