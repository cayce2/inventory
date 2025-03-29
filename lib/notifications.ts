import type { ObjectId } from "mongodb"

export interface Notification {
  _id?: ObjectId
  userId: string | ObjectId
  type: "subscription" | "lowStock" | "system"
  title: string
  message: string
  read: boolean
  createdAt: Date
  relatedItemId?: string | ObjectId
  expiresAt?: Date
}

export interface NotificationCount {
  total: number
  unread: number
}

