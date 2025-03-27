import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createLowStockNotification } from "@/lib/notificationManager"

// This route will be triggered daily at 9 AM (UTC)
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max duration

// Configure the cron schedule
export const config = {
  cron: "0 9 * * *", // Run at 9 AM every day
}

export async function GET() {
  try {
    console.log("Running low stock check job")

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find all items that are below their low stock threshold
    const lowStockItems = await db
      .collection("inventory")
      .find({
        $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      })
      .toArray()

    console.log(`Found ${lowStockItems.length} items below low stock threshold`)

    // Create notifications for each low stock item
    for (const item of lowStockItems) {
      await createLowStockNotification(item.userId.toString(), item.name, item.quantity)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Low stock check completed successfully",
        itemsChecked: lowStockItems.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in low stock check cron job:", error)
    return NextResponse.json({ success: false, error: "Failed to check low stock items" }, { status: 500 })
  }
}

