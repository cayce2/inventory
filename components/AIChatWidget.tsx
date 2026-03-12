/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Paperclip, Send, X } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export default function AIChatWidget() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about stock levels, reorder suggestions, forecasts, or invoice anomalies. Example: “How many units of SKU ABC123?”",
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [attachment, setAttachment] = useState<File | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const quickPrompts = useMemo(
    () => [
      "Show low stock items",
      "Generate reorder suggestions",
      "Forecast next month sales",
      "Analyze invoice pricing anomalies",
      "Create invoice for customer John Doe phone +254700000000 for 10 units of SKU ABC123 due 2026-03-31",
    ],
    [],
  )

  useEffect(() => {
    if (!isOpen) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isOpen])

  useEffect(() => {
    fetchLowStockCount()
  }, [])

  const fetchLowStockCount = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const response = await fetch("/api/alerts/low-stock", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLowStockCount(Number(data.total || 0))
      }
    } catch (error) {
      console.error("Error fetching low stock count:", error)
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
      const hasAttachment = Boolean(attachment)
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: hasAttachment
          ? { Authorization: `Bearer ${token}` }
          : {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
        body: hasAttachment
          ? (() => {
              const formData = new FormData()
              formData.append("message", content)
              if (attachment) {
                formData.append("image", attachment)
              }
              return formData
            })()
          : JSON.stringify({ message: content }),
      })
      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Sorry, I ran into an error. Please try again." },
      ])
    } catch (error) {
      console.error("Error sending assistant message:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I ran into an error. Please try again." },
      ])
    } finally {
      setIsSending(false)
      setAttachment(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen && (
        <div className="mb-4 w-[340px] sm:w-[380px] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-2">
                <Bot className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Inventory Assistant</p>
                <p className="text-xs text-gray-500">Chat to check stock, reorders, invoices</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:text-gray-600"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pt-3 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={() => router.push("/billing?create=1")}
                className="rounded-md bg-blue-600 px-2 py-2 text-[11px] font-semibold text-white hover:bg-blue-700"
              >
                Generate Invoice
              </button>
              <button
                onClick={() => router.push("/billing?create=1")}
                className="rounded-md border border-blue-200 px-2 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
              >
                Create Invoice
              </button>
              <button
                onClick={() => router.push("/billing")}
                className="rounded-md border border-gray-200 px-2 py-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Check Invoices
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-3 border-t border-gray-100">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 text-xs max-w-[82%] ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isSending && <div className="text-xs text-gray-500">Assistant is thinking...</div>}
          </div>

          <div className="flex items-end gap-2 border-t border-gray-100 px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setAttachment(file)
              }}
            />
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
              className="min-h-[44px] max-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Attach image"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={isSending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {attachment && (
            <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-600">
              Attachment: {attachment.name}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
        aria-label="Open assistant"
      >
        <Bot className="h-4 w-4" />
        Chat Assistant
        {lowStockCount > 0 && (
          <span className="absolute -top-2 -right-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {lowStockCount}
          </span>
        )}
      </button>
    </div>
  )
}
