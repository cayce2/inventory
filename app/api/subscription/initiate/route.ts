import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { authMiddleware } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await clientPromise
    const db = client.db("inventory_management")
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: 200000, // 2000 KES in kobo/cents
        currency: "KES",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/paystack-callback`,
        metadata: { userId: userId.toString() },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { subscriptionStatus: "pending", paystackReference: data.data.reference } }
    )

    return NextResponse.json({ success: true, paymentUrl: data.data.authorization_url })
  } catch (error) {
    console.error("Error initiating subscription:", error)
    return NextResponse.json({ error: "An error occurred while initiating subscription" }, { status: 500 })
  }
}
