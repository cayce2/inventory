/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  ArrowLeft, 
  Printer, 
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Interface definitions
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

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export default function AdminInvoiceDetail() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.invoiceId as string
  const currency = "KES"

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

  const handleDownload = async () => {
    if (!invoice) return;

    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Select the invoice details container
      const printContainer = document.querySelector('.print-container');
      
      if (printContainer) {
        // Use html2canvas to convert the container to a canvas
        const canvas = await html2canvas(printContainer as HTMLElement, {
          scale: 2,
          useCORS: true
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');
        
        // Get PDF page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();


        // Calculate image dimensions to fit the page
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the image to the PDF
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Save the PDF
        doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  }

  const handleShare = async () => {
    if (!invoice) return;

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: `Invoice #${invoice.invoiceNumber}`,
          text: `Invoice for ${invoice.customerName} - Total: ${formatCurrency(invoice.amount)}`,
          // Note: In a real app, you'd generate a shareable link here
          url: window.location.href
        });
      } else {
        // Fallback for browsers not supporting Web Share API
        // Could copy to clipboard or show a modal with share options
        await navigator.clipboard.writeText(
          `Invoice #${invoice.invoiceNumber} for ${invoice.customerName}\n` +
          `Total Amount: ${formatCurrency(invoice.amount)}\n` +
          `View at: ${window.location.href}`
        );
        alert("Invoice details copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing invoice:", error);
      alert("Failed to share invoice. Please try again.");
    }
  }

  const handleEmail = () => {
    if (!invoice) return;

    // Open default email client with pre-filled details
    const subject = encodeURIComponent(`Invoice #${invoice.invoiceNumber}`);
    const body = encodeURIComponent(
      `Invoice Details:\n` +
      `Invoice Number: ${invoice.invoiceNumber}\n` +
      `Customer: ${invoice.customerName}\n` +
      `Total Amount: ${formatCurrency(invoice.amount)}\n` +
      `Status: ${invoice.status.toUpperCase()}\n\n` +
      `View full invoice at: ${window.location.href}`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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

  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  // Loading state
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

  // Error state
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
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, 
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .print-hide {
            display: none !important;
          }
          .print-container .card {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      <NavbarLayout>
        <div className="container mx-auto py-8 px-4 max-w-5xl print:px-0 print-container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 print-hide">
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
            
            <div className="flex flex-wrap gap-2">
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
              <div className={`p-4 ${getStatusColor(invoice.status)} border-b`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium">Invoice #{invoice.invoiceNumber}</h2>
                    <p className="text-sm opacity-80">
                      {invoice.status === "paid" ? "Paid on " + formatDate(invoice.dueDate) : `Due in ${daysRemaining} days`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Total Amount</p>
                    <p className="text-xl font-bold">{formatAmount(invoice.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Customer and Invoice Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-xs font-medium text-gray-600 mb-2">Customer</h3>
                    <p className="font-medium">{invoice.customerName}</p>
                    <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs font-medium text-gray-600 mb-2">Invoice Details</h3>
                    <p className="text-sm">Invoice Date: {formatDate(invoice.createdAt)}</p>
                    <p className="text-sm">Due Date: {formatDate(invoice.dueDate)}</p>
                    <p className="text-sm">
                      Status: 
                      <span className={`ml-2 ${invoice.status === "paid" ? "text-emerald-800" : "text-amber-800"}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-center">Quantity</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-2">{item.name || "Unknown Item"}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{item.price ? formatAmount(item.price) : "N/A"}</td>
                        <td className="p-2 text-right">{formatAmount((item.price || 0) * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-500">Subtotal</span>
                      <span className="text-xs font-medium">{formatAmount(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-500">Tax</span>
                      <span className="text-xs font-medium">{formatAmount(0)}</span>
                    </div>
                    <div className="border-t my-1"></div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-bold">{formatAmount(invoice.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4 text-xs text-gray-600 italic">
                  Thank you for your business. Please make payment by the due date.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </NavbarLayout>
    </>
  )
}