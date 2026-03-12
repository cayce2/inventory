/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { authMiddleware } from "@/lib/auth-middleware"
import {
  getInvoiceAnomalies,
  getLowStockCounts,
  getReorderSuggestions,
  getSalesForecast,
} from "@/lib/assistant"

export async function GET(req: NextRequest) {
  try {
    const userId = await authMiddleware(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [lowStock, reorderSuggestions, forecast, invoiceAnomalies] = await Promise.all([
      getLowStockCounts(userId),
      getReorderSuggestions(userId),
      getSalesForecast(userId),
      getInvoiceAnomalies(userId),
    ])

    return NextResponse.json(
      {
        lowStockCount: lowStock.total,
        lowStockItems: lowStock.items.slice(0, 6),
        outOfStockCount: lowStock.out,
        reorderSuggestions: reorderSuggestions.slice(0, 6),
        forecast,
        invoiceAnomalies: invoiceAnomalies.slice(0, 6),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching assistant insights:", error)
    return NextResponse.json({ error: "An error occurred while fetching insights" }, { status: 500 })
  }
}
