/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const adminId = await authMiddleware(req)
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Verify the requester is an admin
    const admin = await db.collection("users").findOne({ _id: new ObjectId(adminId) })
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID from the URL params
    const { userId } = params

    // Validate the user ID
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Fetch the user
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }, // Exclude password
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch additional user data
    const invoices = await db
      .collection("invoices")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    const inventoryCount = await db.collection("inventory").countDocuments({ userId: userId })

    const loginHistory = await db
      .collection("login_history")
      .find({ userId: new ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray()

    return NextResponse.json(
      {
        user,
        stats: {
          invoiceCount: invoices.length,
          recentInvoices: invoices,
          inventoryCount,
          loginHistory,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json(
      {
        error: "An error occurred while fetching user details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const adminId = await authMiddleware(req)
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Verify the requester is an admin
    const admin = await db.collection("users").findOne({ _id: new ObjectId(adminId) })
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID from the URL params
    const { userId } = params

    // Validate the user ID
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Parse the request body
    const data = await req.json()
    console.log("Update data:", data)

    // Validate required fields
    if (!data) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 })
    }

    // Prepare update data - only allow specific fields to be updated
    const updateData: Record<string, any> = {}

    // Fields that can be updated
    const allowedFields = [
      "name",
      "email",
      "phone",
      "role",
      "suspended",
      "subscriptionStatus",
      "subscriptionEndDate",
      "paymentDue",
    ]

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    })

    // Add updatedAt timestamp
    updateData.updatedAt = new Date()
    updateData.updatedBy = new ObjectId(adminId)

    console.log("Applying updates:", updateData)

    // Update the user
    const result = await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "User updated successfully",
        modifiedCount: result.modifiedCount,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      {
        error: "An error occurred while updating the user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const adminId = await authMiddleware(req)
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Verify the requester is an admin
    const admin = await db.collection("users").findOne({ _id: new ObjectId(adminId) })
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID from the URL params
    const { userId } = params

    // Validate the user ID
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Check if user exists before deletion
    const userExists = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete the user
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    // Log the deletion
    await db.collection("audit_logs").insertOne({
      action: "user_deleted",
      userId: new ObjectId(userId),
      performedBy: new ObjectId(adminId),
      timestamp: new Date(),
      details: { deletedUser: userExists.email }
    })

    return NextResponse.json(
      {
        message: "User deleted successfully",
        deletedCount: result.deletedCount,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      {
        error: "An error occurred while deleting the user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}