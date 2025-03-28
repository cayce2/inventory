import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createPaymentDueNotification } from "@/lib/notificationManager"

export const runtime = "nodejs"
export const preferredRegion = ["iad1"]
export const dynamic = "force-dynamic"
export const maxDuration = 60 // 5 minutes timeout

// The new way to configure scheduled tasks in Next.js
export const revalidate = "0 10 * * *" // Run at 10 AM every day

export async function GET() {
  try {
    console.log("Running payment due check job")
    const client = await clientPromise;
    const db = client.db();
    
    // Example implementation - adjust according to your needs
    const payments = await db.collection('payments').find({ status: 'due' }).toArray();
    
    for (const payment of payments) {
      await createPaymentDueNotification(payment.userId, payment.amount);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in payment check job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
