/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"

// PUT /api/user/sub-users/[id]/status - Update sub-user status (active/inactive)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subUserId = params.id
    const data = await req.json()
    const { status } = data

    // Validate status
    const validStatuses = ['active', 'inactive', 'pending']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: active, inactive, pending" 
      }, { status: 400 })
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

    // Update sub-user status
    const result = await db.collection("sub_users").updateOne(
      { id: subUserId, parentUserId: userId },
      { 
        $set: { 
          status,
          updatedAt: new Date(),
          // If activating a pending user, set lastLogin to null
          ...(status === 'active' && existingSubUser.status === 'pending' && { lastLogin: null })
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Sub-user not found or access denied" }, { status: 404 })
    }

    // TODO: If status is changed to 'inactive', you might want to:
    // 1. Invalidate any active sessions for this sub-user
    // 2. Send notification email to the sub-user
    // 3. Log this action for audit purposes

    return NextResponse.json({ 
      message: `Sub-user status updated to ${status} successfully` 
    })
  } catch (error) {
    console.error("Error updating sub-user status:", error)
    return NextResponse.json({ error: "An error occurred while updating the sub-user status" }, { status: 500 })
  }
}