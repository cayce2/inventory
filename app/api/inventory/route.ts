/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest,  NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

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
    return NextResponse.json({ error: "An error occurred while fetching inventory" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, quantity, price, imageUrl, lowStockThreshold } = await req.json()
    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("inventory").insertOne({
      userId,
      name,
      quantity,
      price,
      imageUrl,
      lowStockThreshold,
    })

    return NextResponse.json({ message: "Item added successfully", itemId: result.insertedId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while adding the item" }, { status: 500 })
  }
}

// Modify the existing PUT function to handle editing
export async function PUT(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId, name, quantity, price, imageUrl, lowStockThreshold } = await req.json()
    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("inventory").updateOne(
      { _id: new ObjectId(itemId), userId },
      {
        $set: {
          name,
          quantity,
          price,
          imageUrl,
          lowStockThreshold,
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item updated successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while updating the item" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await req.json()
    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("inventory").deleteOne({
      _id: new ObjectId(itemId),
      userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while deleting the item" }, { status: 500 })
  }
}

