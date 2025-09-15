/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { subUserUpdateSchema } from "@/lib/validations"

// Define user roles
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

// PUT /api/user/sub-users/[id] - Update a specific sub-user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subUserId = params.id
    const data = await req.json()

    // Validate input data
    try {
      subUserUpdateSchema.parse(data)
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
    if (role && !Object.keys(USER_ROLES).includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find the sub-user and verify ownership
    const existingSubUser = await db.collection("sub_users").findOne({
      id: subUserId,
      parentUserId: userId
    })

    if (!existingSubUser) {
      return NextResponse.json({ error: "Sub-user not found or access denied" }, { status: 404 })
    }

    // Check if email is already in use by another user/sub-user (if email is being changed)
    if (email && email !== existingSubUser.email) {
      const existingUser = await db.collection("users").findOne({ email })
      const existingSubUserWithEmail = await db.collection("sub_users").findOne({
        email,
        id: { $ne: subUserId }
      })

      if (existingUser || existingSubUserWithEmail) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }
    }

    // Update sub-user
    const updateData: any = {
      updatedAt: new Date()
    }

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role

    const result = await db.collection("sub_users").updateOne(
      { id: subUserId, parentUserId: userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Sub-user not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ message: "Sub-user updated successfully" })
  } catch (error) {
    console.error("Error updating sub-user:", error)
    return NextResponse.json({ error: "An error occurred while updating the sub-user" }, { status: 500 })
  }
}

// DELETE /api/user/sub-users/[id] - Delete a specific sub-user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subUserId = params.id

    const client = await clientPromise
    const db = client.db("inventory_management")

    // Find and delete the sub-user (verify ownership)
    const result = await db.collection("sub_users").deleteOne({
      id: subUserId,
      parentUserId: userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Sub-user not found or access denied" }, { status: 404 })
    }

    // TODO: You might want to handle cleanup of any data associated with this sub-user
    // For example, reassign or delete records created by this sub-user

    return NextResponse.json({ message: "Sub-user deleted successfully" })
  } catch (error) {
    console.error("Error deleting sub-user:", error)
    return NextResponse.json({ error: "An error occurred while deleting the sub-user" }, { status: 500 })
  }
}