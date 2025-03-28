import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

export async function checkAndUpdateSubscriptions() {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const now = new Date()

  // Find subscriptions expiring in 7 days
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingExpirations = await db
    .collection("users")
    .find({
      subscriptionStatus: "active",
      subscriptionEndDate: {
        $gt: now,
        $lte: sevenDaysFromNow,
      },
    })
    .toArray()

  // Create notifications for upcoming expirations
  for (const user of upcomingExpirations) {
    // Check if a notification for this expiration already exists
    const existingNotification = await db.collection("notifications").findOne({
      userId: user._id,
      type: "subscription",
      "metadata.expirationDate": user.subscriptionEndDate,
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Created in the last 24 hours
    })

    if (!existingNotification) {
      const daysRemaining = Math.ceil(
        (new Date(user.subscriptionEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )

      await db.collection("notifications").insertOne({
        userId: user._id,
        title: "Subscription Expiring Soon",
        message: `Your subscription will expire in ${daysRemaining} days. Please renew to avoid service interruption.`,
        type: "subscription",
        isRead: false,
        createdAt: new Date(),
        metadata: {
          expirationDate: user.subscriptionEndDate,
        },
      })

      // Email sending removed
    }
  }

  // Find expired subscriptions
  const expiredSubscriptions = await db
    .collection("users")
    .find({
      subscriptionStatus: "active",
      subscriptionEndDate: { $lte: now },
    })
    .toArray()

  // Update expired subscriptions and create notifications
  for (const user of expiredSubscriptions) {
    await db.collection("users").updateOne({ _id: user._id }, { $set: { subscriptionStatus: "expired" } })

    // Check if a notification for this expiration already exists
    const existingNotification = await db.collection("notifications").findOne({
      userId: user._id,
      type: "subscription",
      message: { $regex: "Your subscription has expired" },
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Created in the last 24 hours
    })

    if (!existingNotification) {
      await db.collection("notifications").insertOne({
        userId: user._id,
        title: "Subscription Expired",
        message: "Your subscription has expired. Please renew to continue using all features.",
        type: "subscription",
        isRead: false,
        createdAt: new Date(),
      })

      // Email sending removed
    }
  }
}

export async function renewSubscription(userId: string) {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const now = new Date()
  const newEndDate = new Date(now.setMonth(now.getMonth() + 1)) // Renew for 1 month

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        subscriptionStatus: "active",
        subscriptionEndDate: newEndDate,
      },
    },
  )

  // Create a notification for the renewal
  await db.collection("notifications").insertOne({
    userId: new ObjectId(userId),
    title: "Subscription Renewed",
    message: `Your subscription has been renewed and will expire on ${newEndDate.toLocaleDateString()}.`,
    type: "subscription",
    isRead: false,
    createdAt: new Date(),
  })

  // Email sending removed
}

// Function to create a low stock notification
export async function createLowStockNotification(userId: string, itemName: string, currentQuantity: number) {
  const client = await clientPromise
  const db = client.db("inventory_management")

  await db.collection("notifications").insertOne({
    userId: new ObjectId(userId),
    title: "Low Stock Alert",
    message: `${itemName} is running low on stock (${currentQuantity} remaining). Consider restocking soon.`,
    type: "inventory",
    isRead: false,
    createdAt: new Date(),
  })
}

// Function to create a payment due notification
export async function createPaymentDueNotification(userId: string, amount: number) {
  const client = await clientPromise
  const db = client.db("inventory_management")

  await db.collection("notifications").insertOne({
    userId: new ObjectId(userId),
    title: "Payment Due",
    message: `You have a payment of $${amount.toFixed(2)} due. Please make your payment to avoid service interruption.`,
    type: "payment",
    isRead: false,
    createdAt: new Date(),
  })
}

