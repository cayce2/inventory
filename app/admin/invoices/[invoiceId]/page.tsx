/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { ArrowLeft, Printer, Calendar, Phone, User, FileText, Clock, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Invoice Details</h1>
            <Button variant="outline" onClick={() => router.push("/admin/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </NavbarLayout>
    )
  }

  if (error || !invoice) {
    return (
      <NavbarLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Invoice Details</h1>
            <Button variant="outline" onClick={() => router.push("/admin/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center text-red-700">
                <X className="h-5 w-5 mr-2" />
                <p>{error || "Invoice not found"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="container mx-auto py-8 px-4 print:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-gray-500">
              {invoice.status === "paid" ? (
                <Badge variant="success" className="mt-2">
                  <Check className="mr-1 h-3 w-3" />
                  PAID
                </Badge>
              ) : (
                <Badge variant="destructive" className="mt-2">
                  <Clock className="mr-1 h-3 w-3" />
                  UNPAID
                </Badge>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.push("/admin/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <Card className="mb-8 shadow-md print:shadow-none">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium mb-4">
                  <FileText className="mr-2 h-4 w-4" />
                  INVOICE
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Calendar className="mr-2 h-4 w-4" />
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(invoice.createdAt)}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  <div>
                    <span className="font-medium">Due:</span> {formatDate(invoice.dueDate)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Created By</h3>
                <div className="flex items-start">
                  <User className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{invoice.userName || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{invoice.userEmail || "Unknown"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8 p-4 rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <User className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{invoice.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{invoice.customerPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-lg border overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name || "Unknown Item"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.price?.toFixed(2) || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium text-right">
                          ${((item.price || 0) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-end">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-500">Subtotal</span>
                      <span className="text-sm font-medium">${invoice.amount.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-bold text-lg">${invoice.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Notes</h3>
              <p className="text-sm text-blue-700">
                Thank you for your business. Please make payment by the due date.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </NavbarLayout>
  )
}