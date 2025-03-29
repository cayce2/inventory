/* eslint-disable @typescript-eslint/no-explicit-any */
import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

// Create a notification
export async function createNotification(
  userId: string | ObjectId,
  type: "subscription" | "lowStock" | "system",
  title: string,
  message: string,
  relatedItemId?: string | ObjectId,
) {
  try {
    const client = await clientPromise
    const db = client.db("inventory_management")

    const notification = {
      userId: typeof userId === "string" ? new ObjectId(userId) : userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      ...(relatedItemId && {
        relatedItemId: typeof relatedItemId === "string" ? new ObjectId(relatedItemId) : relatedItemId,
      }),
    }

    await db.collection("notifications").insertOne(notification)
    return true
  } catch (error) {
    console.error("Error creating notification:", error)
    return false
  }
}

// Check for subscription expirations and create notifications
export async function checkSubscriptionExpirations() {
  try {
    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find users with active subscriptions that expire in the next 7 days
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const today = new Date()

    const users = await db
      .collection("users")
      .find({
        subscriptionStatus: "active",
        subscriptionEndDate: {
          $gte: today,
          $lte: sevenDaysFromNow,
        },
      })
      .toArray()

    console.log(`Found ${users.length} users with subscriptions expiring in the next 7 days`)

    // Create notifications for each user
    for (const user of users) {
      const daysLeft = Math.ceil(
        (new Date(user.subscriptionEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Create notification
      await createNotification(
        user._id,
        "subscription",
        "Subscription Expiring Soon",
        `Your subscription will expire in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Please renew to avoid service interruption.`,
      )
    }

    // Find users with expired subscriptions
    const expiredUsers = await db
      .collection("users")
      .find({
        subscriptionStatus: "active",
        subscriptionEndDate: { $lt: today },
      })
      .toArray()

    console.log(`Found ${expiredUsers.length} users with expired subscriptions`)

    // Update subscription status and create notifications
    for (const user of expiredUsers) {
      // Update user subscription status
      await db.collection("users").updateOne({ _id: user._id }, { $set: { subscriptionStatus: "expired" } })

      // Create notification
      await createNotification(
        user._id,
        "subscription",
        "Subscription Expired",
        "Your subscription has expired. Please renew to continue using all features.",
      )
    }

    return true
  } catch (error) {
    console.error("Error checking subscription expirations:", error)
    return false
  }
}

// Check for low stock items and create notifications
export async function checkLowStockItems() {
  try {
    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find all inventory items with quantity below lowStockThreshold
    const lowStockItems = await db
      .collection("inventory")
      .find({
        $expr: { $lt: ["$quantity", "$lowStockThreshold"] },
      })
      .toArray()

    console.log(`Found ${lowStockItems.length} low stock items`)

    // Group items by user
    const itemsByUser = lowStockItems.reduce(
      (acc, item) => {
        const userId = item.userId.toString()
        if (!acc[userId]) {
          acc[userId] = []
        }
        acc[userId].push(item)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Create notifications for each user
    for (const [userId, items] of Object.entries(itemsByUser)) {
      if (items.length === 1) {
        // Single item notification
        const item = items[0]
        await createNotification(
          userId,
          "lowStock",
          "Low Stock Alert",
          `${item.name} is running low on stock (${item.quantity} remaining).`,
          item._id,
        )
      } else if (items.length <= 3) {
        // Few items notification
        const itemNames = items.map((item) => item.name).join(", ")
        await createNotification(
          userId,
          "lowStock",
          "Low Stock Alert",
          `Multiple items are running low on stock: ${itemNames}.`,
        )
      } else {
        // Many items notification
        await createNotification(
          userId,
          "lowStock",
          "Low Stock Alert",
          `${items.length} items are running low on stock. Please check your inventory.`,
        )
      }
    }

    return true
  } catch (error) {
    console.error("Error checking low stock items:", error)
    return false
  }
}

// Clean up old notifications
export async function cleanupOldNotifications(daysToKeep = 30) {
  try {
    const client = await clientPromise
    const db = client.db("inventory_management")

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await db.collection("notifications").deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
    })

    console.log(`Deleted ${result.deletedCount} old notifications`)
    return true
  } catch (error) {
    console.error("Error cleaning up old notifications:", error)
    return false
  }
}

