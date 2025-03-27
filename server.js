import cron from "node-cron"
import { checkAndUpdateSubscriptions } from "./lib/notificationManager"

// Run the job every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running subscription check and update job")
  await checkAndUpdateSubscriptions()
})

// Also check for low stock items and create notifications
cron.schedule("0 9 * * *", async () => {
  console.log("Running low stock check job")
  const clientPromise = await import("./lib/mongodb").then((mod) => mod.default)

  const { createLowStockNotification } = await import("./lib/notificationManager")

  const client = await clientPromise
  const db = client.db("inventory_management")

  // Find all items that are below their low stock threshold
  const lowStockItems = await db
    .collection("inventory")
    .find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    })
    .toArray()

  // Create notifications for each low stock item
  for (const item of lowStockItems) {
    await createLowStockNotification(item.userId.toString(), item.name, item.quantity)
  }
})

