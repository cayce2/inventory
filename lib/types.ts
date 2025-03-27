import type { ObjectId } from "mongodb"

export interface Notification {
  _id: string | ObjectId
  userId: string | ObjectId
  title: string
  message: string
  type: "subscription" | "payment" | "system" | "inventory"
  isRead: boolean
  createdAt: Date
}


