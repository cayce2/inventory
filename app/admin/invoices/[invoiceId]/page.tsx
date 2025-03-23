/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  ArrowLeft, 
  Printer, 
  Phone, 
  FileText, 
  Clock, 
  Check, 
  X,
  Share2,
  Download,
  Mail
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

  const handleDownload = () => {
    // PDF download functionality would be implemented here
    alert("Download PDF functionality would be implemented here")
  }

  const handleShare = () => {
    // Share functionality would be implemented here
    alert("Share functionality would be implemented here")
  }

  const handleEmail = () => {
    // Email functionality would be implemented here
    alert("Email functionality would be implemented here")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    return status === "paid" 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : "bg-amber-50 text-amber-700 border-amber-200"
  }

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 space-y-6">
                <div className="flex justify-between">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 w-48" />
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-20 w-full" />
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
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
            <Button variant="outline" onClick={() => router.push("/admin/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </div>
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center text-red-700">
                <X className="h-6 w-6 mr-3" />
                <p className="text-lg">{error || "Invoice not found"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </NavbarLayout>
    )
  }

  const daysRemaining = getDaysRemaining(invoice.dueDate)
  
  return (
    <NavbarLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl print:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Invoice #{invoice.invoiceNumber}</h1>
              {invoice.status === "paid" ? (
                <Badge className="ml-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">
                  <Check className="mr-1 h-3.5 w-3.5" />
                  PAID
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  UNPAID
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">Created on {formatDate(invoice.createdAt)}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 print:hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => router.push("/admin/invoices")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to Invoices</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleEmail}>
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Email Invoice</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Invoice</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button size="sm" variant="default" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <Card className="mb-8 shadow-sm overflow-hidden border-gray-200">
          <div className="p-0">
            {/* Header Banner */}
            <div className={`p-6 ${getStatusColor(invoice.status)} border-b`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-full">
                    <FileText className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium">Invoice #{invoice.invoiceNumber}</h2>
                    <p className="text-sm opacity-80">
                      {invoice.status === "paid" ? "Paid on " + formatDate(invoice.dueDate) : `Due in ${daysRemaining} days`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex items-center">
                  <div className="text-right">
                    <p className="text-sm opacity-80">Total Amount</p>
                    <p className="text-2xl font-bold">${invoice.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Customer and Invoice Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Info Card */}
                <Card className="border shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-600">Customer</h3>
                    </div>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 bg-blue-100 text-blue-800">
                        <AvatarFallback>{invoice.customerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.customerName}</p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          {invoice.customerPhone}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Details Card */}
                <Card className="border shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Invoice Date:</div>
                      <div className="font-medium text-gray-900">{formatDate(invoice.createdAt)}</div>
                      
                      <div className="text-gray-500">Due Date:</div>
                      <div className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</div>
                      
                      <div className="text-gray-500">Status:</div>
                      <div>
                        {invoice.status === "paid" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Unpaid
                          </span>
                        )}
                      </div>
                      
                      <div className="text-gray-500">Created By:</div>
                      <div className="font-medium text-gray-900">{invoice.userName || "Unknown"}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Invoice Items</h3>
                <div className="bg-gray-50 rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-100">
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
                      <tbody>
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
                </div>
              </div>

              {/* Summary & Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-full max-w-xs bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-500">Subtotal</span>
                      <span className="text-sm font-medium">${invoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-500">Tax</span>
                      <span className="text-sm font-medium">$0.00</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-bold text-lg">${invoice.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Notes</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Thank you for your business. Please make payment by the due date.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </NavbarLayout>
  )
}