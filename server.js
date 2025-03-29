import cron from "node-cron"
import {
  checkAndUpdateSubscriptions,
  createLowStockNotification,
  createPaymentDueNotification,
} from "./lib/notificationManager"

// Run the subscription check job every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running subscription check and update job")
  try {
    await checkAndUpdateSubscriptions()
    console.log("Subscription check completed successfully")
  } catch (error) {
    console.error("Error in subscription check job:", error)
  }
})

// Check for low stock items every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("Running low stock check job")
  try {
    const clientPromise = await import("./lib/mongodb").then((mod) => mod.default)

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
      // Check if a notification was already sent in the last 24 hours
      const existingNotification = await db.collection("notifications").findOne({
        userId: item.userId,
        type: "inventory",
        message: { $regex: item.name },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })

      if (!existingNotification) {
        await createLowStockNotification(item.userId.toString(), item.name, item.quantity)
        console.log(`Created low stock notification for ${item.name}`)
      }
    }
    console.log("Low stock check completed successfully")
  } catch (error) {
    console.error("Error in low stock check job:", error)
  }
})

// Check for payment due every day at 8 AM
cron.schedule("0 8 * * *", async () => {
  console.log("Running payment due check job")
  try {
    const clientPromise = await import("./lib/mongodb").then((mod) => mod.default)
    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find users with payment due
    const usersWithPaymentDue = await db
      .collection("users")
      .find({
        paymentDue: { $gt: 0 },
      })
      .toArray()

    console.log(`Found ${usersWithPaymentDue.length} users with payment due`)

    // Create payment due notifications
    for (const user of usersWithPaymentDue) {
      // Check if a notification was already sent in the last 3 days
      const existingNotification = await db.collection("notifications").findOne({
        userId: user._id,
        type: "payment",
        createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      })

      if (!existingNotification) {
        await createPaymentDueNotification(user._id.toString(), user.paymentDue)
        console.log(`Created payment due notification for user ${user.email}`)
      }
    }
    console.log("Payment due check completed successfully")
  } catch (error) {
    console.error("Error in payment due check job:", error)
  }
})

// Clean up old notifications once a week (Sunday at 1 AM)
cron.schedule("0 1 * * 0", async () => {
  console.log("Running notification cleanup job")
  try {
    const clientPromise = await import("./lib/mongodb").then((mod) => mod.default)
    const client = await clientPromise
    const db = client.db("inventory_management")

    // Delete read notifications older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = await db.collection("notifications").deleteMany({
      isRead: true,
      createdAt: { $lt: thirtyDaysAgo },
    })

    console.log(`Deleted ${result.deletedCount} old read notifications`)
  } catch (error) {
    console.error("Error in notification cleanup job:", error)
  }
})

