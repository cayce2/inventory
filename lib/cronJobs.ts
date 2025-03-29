import { checkSubscriptionExpirations, checkLowStockItems, cleanupOldNotifications } from "./notificationManager"

// Run all notification checks
export async function runNotificationChecks() {
  console.log("Running notification checks...")

  try {
    // Check for subscription expirations
    await checkSubscriptionExpirations()

    // Check for low stock items
    await checkLowStockItems()

    // Clean up old notifications
    await cleanupOldNotifications()

    console.log("Notification checks completed successfully")
    return true
  } catch (error) {
    console.error("Error running notification checks:", error)
    return false
  }
}

