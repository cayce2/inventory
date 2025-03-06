import cron from "node-cron"
import { checkAndUpdateSubscriptions } from "./lib/subscriptionManager"

// Run the job every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running subscription check and update job")
  await checkAndUpdateSubscriptions()
})

