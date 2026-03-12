import { NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "@/lib/auth-middleware"
import { getLowStockCounts } from "@/lib/assistant"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const counts = await getLowStockCounts(userId)
    return NextResponse.json(
      {
        total: counts.total,
        low: counts.low,
        out: counts.out,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching low stock alerts:", error)
    return NextResponse.json({ error: "An error occurred while fetching low stock alerts" }, { status: 500 })
  }
}
