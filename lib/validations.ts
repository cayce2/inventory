/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod"
import { ObjectId } from "mongodb"

// Helper function to validate MongoDB ObjectId
export const isValidObjectId = (id: string): boolean => {
  try {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id
  } catch (error) {
    return false
  }
}

// Custom Zod refinement for ObjectId validation
export const objectIdSchema = z.string().refine(isValidObjectId, {
  message: "Invalid ObjectId format",
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
})

export const refreshTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
})

// User schemas
export const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
})

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
})

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
})

// Inventory schemas
export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().int().nonnegative("Quantity must be a non-negative integer"),
  price: z.number().positive("Price must be a positive number"),
  lowStockThreshold: z.number().int().nonnegative("Low stock threshold must be a non-negative integer"),
})

export const restockSchema = z.object({
  itemId: objectIdSchema,
  quantity: z.number().int().positive("Quantity must be a positive integer"),
})

export const deleteItemSchema = z.object({
  itemId: objectIdSchema,
})

// Billing schemas
export const invoiceItemSchema = z.object({
  itemId: z.string().refine((val) => isValidObjectId(val), {
    message: "Invalid item ID format",
  }),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
})

export const invoiceSchema = z
  .object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    customerName: z.string().min(1, "Customer name is required"),
    customerPhone: z.string().optional().default(""),
    amount: z.number().nonnegative("Amount must be a non-negative number").optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  })
  .transform((data) => {
    // If phone number doesn't match the pattern, provide a default format
    if (data.customerPhone && !/^\+?[1-9]\d{1,14}$/.test(data.customerPhone)) {
      data.customerPhone = "+1" + data.customerPhone.replace(/\D/g, "")
    }
    return data
  })

export const invoiceActionSchema = z.object({
  invoiceId: z.string().refine((val) => ObjectId.isValid(val), {
    message: "Invalid invoice ID format",
  }),
  action: z.enum(["markPaid", "markUnpaid", "delete", "restore"]),
})

// Report schemas
export const reportPeriodSchema = z
  .object({
    period: z.enum(["day", "week", "month", "quarter", "year", "all"]).optional(),
    customDateRange: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      // If customDateRange is true, both startDate and endDate should be provided
      if (data.customDateRange === true) {
        return !!data.startDate && !!data.endDate
      }
      // Otherwise, we'll accept any input and use defaults
      return true
    },
    {
      message: "When using custom date range, both startDate and endDate must be provided",
    },
  )

// Admin schemas
export const userActionSchema = z.object({
  targetUserId: objectIdSchema,
  action: z.enum(["suspend", "unsuspend", "extend", "cancel"]),
  days: z.string().optional(),
})

// Subscription schemas
export const subscriptionActionSchema = z.object({
  action: z.enum(["initiate", "renew", "cancel"]),
})

