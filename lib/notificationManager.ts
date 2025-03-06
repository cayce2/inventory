/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  // Configure your email service here
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendSubscriptionNotification(user: any, action: string) {
  let subject: string
  let text: string

  switch (action) {
    case "extend":
      subject = "Your InventoryPro Subscription Has Been Extended"
      text = `Dear ${user.name},\n\nYour InventoryPro subscription has been extended. Your new subscription end date is ${user.subscriptionEndDate.toDateString()}.\n\nBest regards,\nThe InventoryPro Team`
      break
    case "cancel":
      subject = "Your InventoryPro Subscription Has Been Cancelled"
      text = `Dear ${user.name},\n\nYour InventoryPro subscription has been cancelled. If you believe this is an error, please contact our support team.\n\nBest regards,\nThe InventoryPro Team`
      break
    default:
      subject = "InventoryPro Subscription Update"
      text = `Dear ${user.name},\n\nThere has been an update to your InventoryPro subscription. Please log in to your account for more details.\n\nBest regards,\nThe InventoryPro Team`
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject,
    text,
  }

  await transporter.sendMail(mailOptions)
}

