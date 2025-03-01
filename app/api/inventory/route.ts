/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { put } from "@vercel/blob"
import sharp from "sharp"

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
    const name = formData.get("name") as string
    const quantity = Number.parseInt(formData.get("quantity") as string)
    const price = Number.parseFloat(formData.get("price") as string)
    const lowStockThreshold = Number.parseInt(formData.get("lowStockThreshold") as string)
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Compress the image
    const compressedImageBuffer = await sharp(await imageFile.arrayBuffer())
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Upload the compressed image to Vercel Blob
    const blob = await put(`inventory/${imageFile.name}`, compressedImageBuffer, {
      access: "public",
      contentType: "image/jpeg",
    })

    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("inventory").insertOne({
      userId,
      name,
      quantity,
      price,
      imageUrl: blob.url,
      lowStockThreshold,
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
    const _id = formData.get("_id") as string
    const name = formData.get("name") as string
    const quantity = Number.parseInt(formData.get("quantity") as string)
    const price = Number.parseFloat(formData.get("price") as string)
    const lowStockThreshold = Number.parseInt(formData.get("lowStockThreshold") as string)
    const imageFile = formData.get("image") as File | null

    if (!_id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    const updateData: any = {
      name,
      quantity,
      price,
      lowStockThreshold,
    }

    if (imageFile) {
      // Compress the image
      const compressedImageBuffer = await sharp(await imageFile.arrayBuffer())
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Upload the compressed image to Vercel Blob
      const blob = await put(`inventory/${imageFile.name}`, compressedImageBuffer, {
        access: "public",
        contentType: "image/jpeg",
      })

      updateData.imageUrl = blob.url
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

    const { itemId, quantity } = await req.json()

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid restock data" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Update the item quantity
    const updateResult = await db
      .collection("inventory")
      .updateOne({ _id: new ObjectId(itemId), userId }, { $inc: { quantity: quantity } })

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Add a restock record
    const restockRecord = {
      itemId: new ObjectId(itemId),
      quantity,
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

    const { itemId } = await req.json()

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

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

