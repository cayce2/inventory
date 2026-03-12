/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bot, Sparkles } from "lucide-react"

interface LowStockItem {
  _id: string
  name: string
  sku: string
  quantity: number
  lowStockThreshold: number
}

interface ReorderSuggestion {
  itemId: string
  name: string
  sku: string
  currentQuantity: number
  lowStockThreshold: number
  avgMonthlySales: number
  safetyStock: number
  leadTimeMonths: number
  reorderQuantity: number
}

interface SalesForecast {
  months: Array<{ month: string; total: number }>
  projection: { month: string; total: number }
  averageMonthly: number
}

interface InvoiceAnomaly {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  itemName: string
  sku: string
  baselinePrice: number | null
  invoicePrice: number
  deviationPct: number | null
  reason: string
}

interface AssistantInsights {
  lowStockCount: number
  outOfStockCount: number
  lowStockItems: LowStockItem[]
  reorderSuggestions: ReorderSuggestion[]
  forecast: SalesForecast
  invoiceAnomalies: InvoiceAnomaly[]
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const formatCurrency = (value: number, currencyCode = "KES") => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function AssistantPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<AssistantInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about stock levels, reorder suggestions, forecasts, or invoice anomalies. Example: \"How many units of SKU ABC123?\"",
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const currency = "KES"

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchInsights()
  }, [router])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/assistant/insights", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInsights(response.data)
    } catch (error) {
      setError("Failed to load AI assistant insights.")
      console.error("Error loading assistant insights:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (override?: string) => {
    const content = (override ?? input).trim()
    if (!content || isSending) return

    setMessages((prev) => [...prev, { role: "user", content }])
    setInput("")
    setIsSending(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.post(
        "/api/assistant",
        { message: content },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setMessages((prev) => [...prev, { role: "assistant", content: response.data.response }])
    } catch (error) {
      console.error("Error sending assistant message:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I ran into an error. Please try again." },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const quickPrompts = useMemo(
    () => [
      "Show low stock items",
      "Generate reorder suggestions",
      "Forecast next month sales",
      "Analyze invoice pricing anomalies",
    ],
    [],
  )

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <Bot className="h-7 w-7 text-blue-600" />
                AI Inventory Assistant
              </h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Personalized insights for your inventory, reorders, demand forecasting, and invoice checks.
              </p>
            </div>
            <Button onClick={fetchInsights} variant="outline" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Refresh Insights
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl text-gray-900">Chat with your assistant</CardTitle>
                <CardDescription>Ask naturally about stock levels, SKUs, or reorders.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 text-sm max-w-[80%] ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="text-xs text-gray-500">Assistant is thinking...</div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(prompt)}
                        className="text-xs"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Ask about stock levels, reorder needs, or invoices..."
                      className="min-h-[48px] max-h-[120px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={() => sendMessage()} disabled={isSending} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg text-gray-900">Low stock snapshot</CardTitle>
                <CardDescription>Items at or below threshold right now.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {insights?.lowStockCount ?? 0}
                        </p>
                        <p className="text-xs text-gray-500">Low/out-of-stock items</p>
                      </div>
                      <Badge className="bg-red-50 text-red-700 border-red-200">
                        {insights?.outOfStockCount ?? 0} out of stock
                      </Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {(insights?.lowStockItems || []).slice(0, 4).map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-900">{item.quantity} units</span>
                        </div>
                      ))}
                      {!insights?.lowStockItems?.length && (
                        <p className="text-sm text-gray-500">No low stock items detected.</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg text-gray-900">Smart Reorder Suggestions</CardTitle>
                <CardDescription>2-month lead time + safety stock recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : insights?.reorderSuggestions?.length ? (
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>Avg Monthly</TableHead>
                        <TableHead className="text-right">Reorder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insights.reorderSuggestions.map((item) => (
                        <TableRow key={item.itemId}>
                          <TableCell>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.sku}</div>
                          </TableCell>
                          <TableCell>{item.currentQuantity}</TableCell>
                          <TableCell>{item.avgMonthlySales}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                              {item.reorderQuantity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-sm text-gray-500">
                    No reorder suggestions at the moment.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg text-gray-900">Sales & Demand Forecasting</CardTitle>
                <CardDescription>Monthly sales trend with next month projection.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {insights?.forecast?.months?.map((month) => (
                        <div key={month.month} className="rounded-md border border-gray-100 px-3 py-2">
                          <p className="text-xs text-gray-500">{month.month}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(month.total, currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3">
                      <div>
                        <p className="text-xs text-indigo-600 uppercase tracking-wide">
                          Next Month Projection
                        </p>
                        <p className="text-lg font-bold text-indigo-900">
                          {formatCurrency(insights?.forecast?.projection?.total || 0, currency)}
                        </p>
                      </div>
                      <Badge className="bg-indigo-600 text-white">
                        {insights?.forecast?.projection?.month}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg text-gray-900">Invoice Analysis</CardTitle>
              <CardDescription>Pricing anomalies vs baseline inventory pricing.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : insights?.invoiceAnomalies?.length ? (
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Deviation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.invoiceAnomalies.map((item) => (
                      <TableRow key={`${item.invoiceId}-${item.itemName}`}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.invoiceNumber}</div>
                          <div className="text-xs text-gray-500">{item.customerName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-xs text-gray-500">{item.sku}</div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{item.reason}</TableCell>
                        <TableCell className="text-right">
                          {item.deviationPct === null ? (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200">N/A</Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 border-red-200">
                              {(item.deviationPct * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-sm text-gray-500">
                  No invoice anomalies detected in the last 90 days.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </NavbarLayout>
  )
}
