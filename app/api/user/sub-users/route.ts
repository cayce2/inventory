/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
//import { ObjectId } from "mongodb"
import { subUserCreateSchema } from "@/lib/validations"
import { v4 as uuidv4 } from 'uuid'

// Define user roles with their permissions
const USER_ROLES = {
  ADMIN: {
    name: 'Admin',
    description: 'Full access to all features and settings',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings']
  },
  EDITOR: {
    name: 'Editor',
    description: 'Can create, edit, and delete content',
    permissions: ['read', 'write', 'delete']
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access to content',
    permissions: ['read']
  },
  MODERATOR: {
    name: 'Moderator',
    description: 'Can moderate content and manage users',
    permissions: ['read', 'write', 'manage_users']
  }
}

interface SubUser {
  id: string
  name: string
  email: string
  role: keyof typeof USER_ROLES
  status: 'active' | 'inactive' | 'pending'
  createdAt: Date
  lastLogin?: Date
  parentUserId: string
}

// GET /api/user/sub-users - Fetch all sub-users for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Fetch all sub-users for this parent user
    const subUsers = await db
      .collection("sub_users")
      .find({ parentUserId: userId })
      .sort({ createdAt: -1 })
      .toArray()

    // Transform MongoDB documents to match the expected format
    const formattedSubUsers = subUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined
    }))

    return NextResponse.json({ subUsers: formattedSubUsers })
  } catch (error) {
    console.error("Error fetching sub-users:", error)
    return NextResponse.json({ error: "An error occurred while fetching sub-users" }, { status: 500 })
  }
}

// POST /api/user/sub-users - Create a new sub-user
export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate input data
    try {
      subUserCreateSchema.parse(data)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        },
        { status: 400 }
      )
    }

    const { name, email, role } = data

    // Validate role
    if (!Object.keys(USER_ROLES).includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Check if email is already in use by any user or sub-user
    const existingUser = await db.collection("users").findOne({ email })
    const existingSubUser = await db.collection("sub_users").findOne({ email })

    if (existingUser || existingSubUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
    }

    // Check if the parent user has reached their sub-user limit (optional)
    const subUserCount = await db.collection("sub_users").countDocuments({ parentUserId: userId })
    const MAX_SUB_USERS = 10 // You can make this configurable per user plan
    
    if (subUserCount >= MAX_SUB_USERS) {
      return NextResponse.json({ 
        error: `You have reached the maximum limit of ${MAX_SUB_USERS} sub-users` 
      }, { status: 400 })
    }

    // Create new sub-user
    const newSubUser: SubUser = {
      id: uuidv4(),
      name,
      email,
      role: role as keyof typeof USER_ROLES,
      status: 'pending',
      createdAt: new Date(),
      parentUserId: userId
    }

    const result = await db.collection("sub_users").insertOne(newSubUser)

    if (!result.insertedId) {
      return NextResponse.json({ error: "Failed to create sub-user" }, { status: 500 })
    }

    // TODO: Send invitation email to the sub-user
    // await sendInvitationEmail(email, name, role)

    return NextResponse.json({ 
      message: "Sub-user created successfully",
      subUser: {
        id: newSubUser.id,
        name: newSubUser.name,
        email: newSubUser.email,
        role: newSubUser.role,
        status: newSubUser.status,
        createdAt: newSubUser.createdAt.toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating sub-user:", error)
    return NextResponse.json({ error: "An error occurred while creating the sub-user" }, { status: 500 })
  }
}