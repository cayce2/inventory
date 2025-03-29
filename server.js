import cron from "node-cron"
import { checkAndUpdateSubscriptions } from "./lib/subscriptionManager"
import { runNotificationChecks } from "./lib/cronJobs"
import axios from "axios"

// Run the subscription check and update job every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running subscription check and update job")
  await checkAndUpdateSubscriptions()
})

// Run the notification checks every day at 1 AM
cron.schedule("0 1 * * *", async () => {
  console.log("Running notification checks via cron job")

  try {
    // Call the notification checks endpoint
    const response = await axios.post(
      `${process.env.VERCEL_URL || "http://localhost:3000"}/api/cron/notifications`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      },
    )

    console.log("Notification checks response:", response.data)
  } catch (error) {
    console.error("Error running notification checks:", error)

    // Fallback to direct function call if API call fails
    await runNotificationChecks()
  }
})

