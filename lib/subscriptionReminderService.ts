import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

// Configure nodemailer (using the existing configuration)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface User {
  _id: ObjectId;
  name: string;
  email: string;
  subscriptionStatus: string;
  subscriptionEndDate: Date;
  lastReminderSent?: Date;
  reminderCount?: number;
}

export async function checkAndSendSubscriptionReminders() {
  console.log("Running subscription reminder check...")
  const client = await clientPromise
  const db = client.db("inventory_management")

  const now = new Date()
  
  // Calculate dates for different reminder thresholds
  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(now.getDate() + 7)
  
  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(now.getDate() + 3)
  
  const oneDayFromNow = new Date(now)
  oneDayFromNow.setDate(now.getDate() + 1)

  // Find users with active subscriptions that will expire in the next 7 days
  const usersToRemind = await db.collection("users").find({
    subscriptionStatus: "active",
    subscriptionEndDate: { 
      $gt: now,
      $lte: sevenDaysFromNow 
    },
    // Either no reminder sent yet, or last reminder was sent more than 1 day ago
    $or: [
      { lastReminderSent: { $exists: false } },
      { lastReminderSent: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
    ]
  }).toArray() as User[]

  console.log(`Found ${usersToRemind.length} users to remind about subscription expiration`)

  let remindersSent = 0

  for (const user of usersToRemind) {
    const daysUntilExpiration = Math.ceil(
      (user.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Determine which reminder to send based on days until expiration
    let reminderType: "seven_day" | "three_day" | "one_day" | null = null
    
    if (daysUntilExpiration <= 1) {
      reminderType = "one_day"
    } else if (daysUntilExpiration <= 3) {
      reminderType = "three_day"
    } else if (daysUntilExpiration <= 7) {
      reminderType = "seven_day"
    }
    
    if (reminderType) {
      await sendSubscriptionReminder(user, reminderType, daysUntilExpiration)
      
      // Update the user's reminder status
      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { lastReminderSent: now },
          $inc: { reminderCount: 1 }
        }
      )
      
      remindersSent++
    }
  }

  console.log(`Successfully sent ${remindersSent} subscription reminders`)
  return remindersSent
}

async function sendSubscriptionReminder(
  user: User, 
  reminderType: "seven_day" | "three_day" | "one_day",
  daysRemaining: number
) {
  const subject = getEmailSubject(reminderType)
  const body = getEmailBody(user.name, reminderType, daysRemaining, user.subscriptionEndDate)
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject,
    html: body,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Sent ${reminderType} reminder to ${user.email}`)
    return true
  } catch (error) {
    console.error(`Failed to send reminder to ${user.email}:`, error)
    return false
  }
}

function getEmailSubject(reminderType: "seven_day" | "three_day" | "one_day"): string {
  switch (reminderType) {
    case "seven_day":
      return "Your InventoryPro Subscription Expires in 7 Days"
    case "three_day":
      return "Reminder: Your InventoryPro Subscription Expires in 3 Days"
    case "one_day":
      return "Urgent: Your InventoryPro Subscription Expires Tomorrow"
  }
}

function getEmailBody(
  userName: string, 
  reminderType: "seven_day" | "three_day" | "one_day",
  daysRemaining: number,
  expirationDate: Date
): string {
  const formattedDate = expirationDate.toLocaleDateString()
  
  let urgencyLevel = ""
  let callToAction = ""
  
  switch (reminderType) {
    case "seven_day":
      urgencyLevel = "Your subscription will expire soon."
      callToAction = "To ensure uninterrupted access to all features, please renew your subscription."
      break
    case "three_day":
      urgencyLevel = "Your subscription is expiring very soon."
      callToAction = "To avoid any interruption in service, please renew your subscription as soon as possible."
      break
    case "one_day":
      urgencyLevel = "Your subscription expires tomorrow!"
      callToAction = "To maintain access to all features, please renew your subscription immediately."
      break
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">InventoryPro Subscription Reminder</h2>
      <p>Dear ${userName},</p>
      
      <p><strong>${urgencyLevel}</strong> Your InventoryPro subscription will expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} on ${formattedDate}.</p>
      
      <p>${callToAction}</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold;">Subscription Details:</p>
        <p style="margin: 5px 0;">Expiration Date: ${formattedDate}</p>
        <p style="margin: 5px 0;">Days Remaining: ${daysRemaining}</p>
      </div>
      
      <p>To renew your subscription, simply log in to your account and visit the Subscription page.</p>
      
      <div style="margin: 25px 0;">
        <a href="${process.env.APP_URL || 'https://your-app-url.com'}/subscription" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Renew Subscription</a>
      </div>
      
      <p>If you have any questions or need assistance, please contact our support team.</p>
      
      <p>Thank you for using InventoryPro!</p>
      
      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `
}
