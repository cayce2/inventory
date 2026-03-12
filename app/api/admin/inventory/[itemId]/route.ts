import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = params
    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the inventory item
    const item = await db.collection("inventory").findOne({ _id: new ObjectId(itemId) })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Get user information
    let itemUser = null
    if (item.userId) {
      try {
        const itemUserId =
          typeof item.userId === "object" ? new ObjectId(item.userId.toString()) : new ObjectId(item.userId)
        itemUser = await db
          .collection("users")
          .findOne({ _id: itemUserId }, { projection: { name: 1, email: 1 } })
      } catch {
        itemUser = null
      }
    }

    const itemWithUserInfo = {
      ...item,
      userName: itemUser ? itemUser.name : null,
      userEmail: itemUser ? itemUser.email : null,
    }

    return NextResponse.json(itemWithUserInfo, { status: 200 })
  } catch (error) {
    console.error("Error fetching item:", error)
    return NextResponse.json({ error: "An error occurred while fetching the item" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = params
    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if user is admin
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the inventory item
    const result = await db.collection("inventory").deleteOne({ _id: new ObjectId(itemId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "An error occurred while deleting the item" }, { status: 500 })
  }
}

