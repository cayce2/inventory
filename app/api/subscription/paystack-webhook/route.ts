import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("x-paystack-signature")

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex")

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === "charge.success") {
    const { metadata, reference } = event.data
    const userId = metadata?.userId

    if (userId) {
      const client = await clientPromise
      const db = client.db("inventory_management")

      const now = new Date()
      const endDate = new Date(now.setMonth(now.getMonth() + 1))

      await db.collection("users").updateOne(
        { paystackReference: reference },
        {
          $set: {
            subscriptionStatus: "active",
            subscriptionEndDate: endDate,
            paystackReference: null,
          },
        }
      )
    }
  }

  return NextResponse.json({ received: true })
}
