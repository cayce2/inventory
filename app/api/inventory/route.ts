/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse, NextRequest } from "next/server"
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

    const { name, quantity, price, imageUrl } = await req.json()
    const client = await clientPromise
    const db = client.db("inventory_management")

    const result = await db.collection("inventory").insertOne({
      userId,
      name,
      quantity,
      price,
      imageUrl,
    })

    return NextResponse.json({ message: "Item added successfully", itemId: result.insertedId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while adding the item" }, { status: 500 })
  }
}

