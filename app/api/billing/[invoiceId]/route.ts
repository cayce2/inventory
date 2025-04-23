/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { Db, ObjectId } from "mongodb"

export async function PUT(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = params

    // Log the received invoice ID for debugging
    console.log("Received invoice ID:", invoiceId)

    // Check if invoiceId exists
    if (!invoiceId) {
      console.error("Missing invoice ID in request")
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Parse the request body
    let data
    try {
      data = await req.json()
      console.log("Received action data:", JSON.stringify(data))
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate the action - check for both action and status for backward compatibility
    let action = data?.action
    if (!action && data?.status) {
      // Map status to action for backward compatibility
      action = data.status === "paid" ? "markPaid" : "markUnpaid"
      console.log(`Mapped status "${data.status}" to action "${action}"`)
    }

    // Validate the action
    if (!action) {
      console.error("Missing action in request body")
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // Validate action value
    const validActions = ["markPaid", "markUnpaid", "delete", "restore"]
    if (!validActions.includes(action)) {
      console.error("Invalid action:", action)
      return NextResponse.json({ error: "Invalid action. Must be one of: " + validActions.join(", ") }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Try to convert invoiceId to ObjectId, but handle gracefully if it fails
    let invoiceObjId
    try {
      invoiceObjId = new ObjectId(invoiceId)
    } catch (error) {
      console.error("Failed to convert invoice ID to ObjectId:", error)
      return NextResponse.json({ error: "Invalid invoice ID format" }, { status: 400 })
    }

    // First, check if the invoice exists at all
    const invoice = await db.collection("invoices").findOne({ _id: invoiceObjId })
    if (!invoice) {
      console.error(`Invoice with ID ${invoiceId} not found in database`)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Convert userId to ObjectId if it's a string
    const userIdObj = typeof userId === "string" ? new ObjectId(userId) : userId

    // Log the user IDs for debugging
    console.log("Authenticated user ID:", userIdObj)
    console.log("Invoice user ID:", invoice.userId)

    // Check if the invoice belongs to the user
    if (invoice.userId.toString() !== userIdObj.toString()) {
      console.error(`Invoice belongs to user ${invoice.userId}, not ${userIdObj}`)
      return NextResponse.json({ error: "You don't have permission to modify this invoice" }, { status: 403 })
    }

    let updateData = {}
    
    // Handle special case for delete action when invoice is unpaid
    if (action === "delete" && invoice.status !== "paid") {
      try {
        // Return items to inventory
        await returnItemsToInventory(db, invoice.items, userIdObj)
        console.log(`Items from unpaid invoice ${invoiceId} returned to inventory`)
        updateData = { deleted: true }
      } catch (error) {
        console.error("Error returning items to inventory:", error)
        return NextResponse.json({ 
          error: "Failed to return items to inventory", 
          details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 })
      }
    } else {
      // Handle other actions as before
      switch (action) {
        case "markPaid":
          updateData = { status: "paid" }
          break
        case "markUnpaid":
          updateData = { status: "unpaid" }
          break
        case "delete":
          updateData = { deleted: true }
          break
        case "restore":
          updateData = { deleted: false }
          break
      }
    }

    // Log the update operation for debugging
    console.log(`Updating invoice ${invoiceId} with action ${action}`)
    console.log(`Update data: ${JSON.stringify(updateData)}`)

    const result = await db.collection("invoices").updateOne({ _id: invoiceObjId }, { $set: updateData })

    console.log(`Update result: ${JSON.stringify(result)}`)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Invoice updated successfully",
      inventoryUpdated: action === "delete" && invoice.status !== "paid"
    }, { status: 200 })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      {
        error: "An error occurred while updating the invoice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

/**
 * Returns items from a deleted unpaid invoice back to inventory
 * @param db MongoDB database instance
 * @param items Array of invoice items to return to inventory
 * @param userId User ID who owns the inventory
 */
async function returnItemsToInventory(
  db: Db,
  items: { inventoryItemId: string; quantity: number }[],
  userId: ObjectId
) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log("No items to return to inventory")
    return
  }

  const bulkOps = items.map(item => {
    // Check if item has required properties
    if (!item.inventoryItemId || !item.quantity) {
      console.warn("Skipping invalid item:", item)
      return null
    }

    let itemId
    try {
      itemId = new ObjectId(item.inventoryItemId)
    } catch (error) {
      console.warn(`Invalid inventory item ID format: ${item.inventoryItemId}`)
      return null
    }

    // Create update operation to increment the quantity
    return {
      updateOne: {
        filter: { _id: itemId, userId },
        update: { $inc: { quantity: item.quantity } },
        upsert: false
      }
    } as const
  }).filter((op): op is NonNullable<typeof op> => op !== null)
  
  if (bulkOps.length === 0) {
    console.log("No valid items to return to inventory")
    return
  }

  console.log(`Returning ${bulkOps.length} items to inventory`)
  
  const result = await db.collection("inventory").bulkWrite(bulkOps)
  console.log("Inventory update result:", {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount,
    upsertedCount: result.upsertedCount
  })
  
  if (result.modifiedCount !== bulkOps.length) {
    console.warn(`Only ${result.modifiedCount} of ${bulkOps.length} items were updated in inventory`)
  }
  
  return result
}