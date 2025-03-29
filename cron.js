import cron from "node-cron"
import { checkAndUpdateSubscriptions } from "./lib/subscriptionManager"
import { checkAndSendSubscriptionReminders } from "./lib/subscriptionReminderService"

// Environment variables
//const APP_URL = process.env.APP_URL || "http://localhost:3000"
//const CRON_SECRET = process.env.CRON_SECRET || "your-cron-secret"

// Run the subscription check and update job every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running subscription check and update job")
  try {
    await checkAndUpdateSubscriptions()
    console.log("Subscription check and update completed successfully")
  } catch (error) {
    console.error("Error in subscription check and update job:", error)
  }
})

// Run the subscription reminder job every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("Running subscription reminder job")
  try {
    // Option 1: Call the function directly
    const remindersSent = await checkAndSendSubscriptionReminders()
    console.log(`Subscription reminder job completed successfully. Sent ${remindersSent} reminders.`)
    
    // Option 2: Call the API endpoint (useful if running cron outside the main app)
    /*
    const response = await axios.get(`${APP_URL}/api/cron/subscription-reminders`, {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`
      }
    })
    console.log("Subscription reminder job completed successfully:", response.data)
    */
  } catch (error) {
    console.error("Error in subscription reminder job:", error)
  }
})

// Start the cron scheduler
console.log("Cron scheduler started")
