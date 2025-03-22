"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { ArrowLeft, Printer } from "lucide-react"

interface InvoiceItem {
  itemId: string
  quantity: number
  name?: string
  price?: number
}

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  status: "paid" | "unpaid"
  createdAt: string
  items: InvoiceItem[]
  userId: string
  userName?: string
  userEmail?: string
}

export default function AdminInvoiceDetail() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.invoiceId as string

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails()
    }
  }, [invoiceId])

  const fetchInvoiceDetails = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get(`/api/admin/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInvoice(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching invoice details:", error)
      setError("An error occurred while fetching invoice details")
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-8">Invoice Details</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error || !invoice) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-8">Invoice Details</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Invoice not found"}
          </div>
          <button
            onClick={() => router.push("/admin/invoices")}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Invoices
          </button>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Invoice Details</h1>
          <div className="flex space-x-4">
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Invoice
            </button>
            <button
              onClick={() => router.push("/admin/invoices")}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Invoices
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8 print:shadow-none">
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
              <p className="text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Created By:</p>
              <p>{invoice.userName || "Unknown"}</p>
              <p>{invoice.userEmail || "Unknown"}</p>
            </div>
          </div>

          <div className="flex justify-between mb-8">
            <div>
              <h3 className="font-bold mb-2">Bill To:</h3>
              <p>{invoice.customerName}</p>
              <p>{invoice.customerPhone}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="font-bold">Invoice Date: </span>
                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mb-2">
                <span className="font-bold">Due Date: </span>
                <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-bold">Status: </span>
                <span
                  className={`px-2 py-1 rounded ${
                    invoice.status === "paid" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 mb-8">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name || "Unknown Item"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${item.price?.toFixed(2) || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${((item.price || 0) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-bold">
                  Total:
                </td>
                <td className="px-6 py-4 text-right font-bold">${invoice.amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="border-t pt-8">
            <h3 className="font-bold mb-2">Notes:</h3>
            <p className="text-gray-600">Thank you for your business. Please make payment by the due date.</p>
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}

