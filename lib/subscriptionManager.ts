/* eslint-disable @typescript-eslint/no-explicit-any */
import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

// Configure nodemailer (you'll need to set up your email service)
const transporter = nodemailer.createTransport({
  // Configure your email service here
  // For example, using Gmail:
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function checkAndUpdateSubscriptions() {
  const client = await clientPromise
  const db = client.db("inventory_management")

  const now = new Date()
  const expiringSubscriptions = await db
    .collection("users")
    .find({
      subscriptionStatus: "active",
      subscriptionEndDate: { $lte: now },
    })
    .toArray()

  for (const user of expiringSubscriptions) {
    await updateSubscriptionStatus(user)
  }

  const upcomingRenewals = await db
    .collection("users")
    .find({
      subscriptionStatus: "active",
      subscriptionEndDate: {
        $gt: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    })
    .toArray()

  for (const user of upcomingRenewals) {
    await sendRenewalReminder(user)
  }
}

async function updateSubscriptionStatus(user: any) {
  const client = await clientPromise
  const db = client.db("inventory_management")

  await db.collection("users").updateOne({ _id: user._id }, { $set: { subscriptionStatus: "expired" } })

  await sendExpirationNotification(user)
}

async function sendExpirationNotification(user: any) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your InventoryPro Subscription Has Expired",
    text: `Dear ${user.name},\n\nYour InventoryPro subscription has expired. To continue using all features, please renew your subscription.\n\nBest regards,\nThe InventoryPro Team`,
  }

  await transporter.sendMail(mailOptions)
}

async function sendRenewalReminder(user: any) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your InventoryPro Subscription is Due for Renewal",
    text: `Dear ${user.name},\n\nYour InventoryPro subscription will expire soon. Please renew your subscription to continue using all features.\n\nBest regards,\nThe InventoryPro Team`,
  }

  await transporter.sendMail(mailOptions)
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

  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
  await sendRenewalConfirmation(user)
}

async function sendRenewalConfirmation(user: any) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your InventoryPro Subscription Has Been Renewed",
    text: `Dear ${user.name},\n\nYour InventoryPro subscription has been successfully renewed. Your new subscription end date is ${user.subscriptionEndDate.toDateString()}.\n\nThank you for your continued support!\n\nBest regards,\nThe InventoryPro Team`,
  }

  await transporter.sendMail(mailOptions)
}

