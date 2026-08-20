import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference")

  if (!reference) {
    return NextResponse.redirect(new URL("/subscription?status=failed", req.url))
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })

  const data = await res.json()

  if (data.status && data.data.status === "success") {
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

    return NextResponse.redirect(new URL("/subscription?status=success", req.url))
  }

  return NextResponse.redirect(new URL("/subscription?status=failed", req.url))
}
