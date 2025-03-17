/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import NavbarLayout from "@/components/NavbarLayout"
import Print from "@/components/Print"
import { 
  ArrowLeft, Save, RefreshCw, Printer, 
  CheckCircle, XCircle, CreditCard, 
  Trash2, RotateCcw, PlusCircle, 
  FileText, AlertTriangle, Calendar
} from "lucide-react"

// Types
interface InvoiceItem {
  itemId: string
  quantity: number
  name: string
  price: number
  adjustedPrice?: number
  subtotal: number
}

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  status: "paid" | "unpaid"
  items: InvoiceItem[]
  createdAt: string
  deleted?: boolean
  notes?: string
  paidDate?: string
}

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  address?: string
}

interface Payment {
  _id: string
  invoiceId: string
  amount: number
  method: string
  date: string
  notes?: string
}

// Component-specific interfaces
interface StatusBadgeProps {
  status: "paid" | "unpaid" | "deleted"
}

interface InfoCardProps {
  title: string
  children: React.ReactNode
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant: "primary" | "success" | "warning" | "danger" | "info"
  disabled?: boolean
  isLoading?: boolean
}

// Status Badge Component
const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200"
      case "unpaid":
        return "bg-amber-100 text-amber-800 border border-amber-200"
      case "deleted":
        return "bg-slate-100 text-slate-800 border border-slate-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status?.toUpperCase()}
    </span>
  )
}

// Info Card Component
const InfoCard = ({ title, children }: InfoCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
      {children}
    </div>
  )
}

// Action Button Component
const ActionButton = ({ icon, label, onClick, variant, disabled, isLoading }: ActionButtonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
      case "info":
        return "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
      default:
        return "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center 
      ${getVariantStyles()} transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {isLoading ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : icon}
      <span className="ml-2">{isLoading ? "Processing..." : label}</span>
    </button>
  )
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.invoiceId as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [notes, setNotes] = useState("")
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [activeTab, setActiveTab] = useState<"details" | "payments">("details")

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInvoiceDetails()
  }, [invoiceId])

  const fetchInvoiceDetails = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setInvoice(response.data.invoice)
      setCustomer(response.data.customer)
      setPayments(response.data.payments || [])
      setNotes(response.data.invoice.notes || "")

      // Pre-fill the payment amount if unpaid
      if (response.data.invoice.status === "unpaid") {
        const totalPaid = (response.data.payments || []).reduce(
          (sum: number, payment: Payment) => sum + payment.amount,
          0,
        )
        const amountDue = response.data.invoice.amount - totalPaid
        setPaymentAmount(amountDue)
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to fetch invoice details"}`)
      } else {
        setError("An unexpected error occurred while fetching invoice details")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true)
      setError("")
      setSuccessMessage("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      await axios.put(
        `/api/invoices/${invoiceId}`,
        { notes },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccessMessage("Invoice notes updated successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error updating invoice notes:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to update invoice notes"}`)
      } else {
        setError("An unexpected error occurred while updating invoice notes")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (action: string) => {
    try {
      setIsSaving(true)
      setError("")
      setSuccessMessage("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      await axios.put(
        `/api/invoices/${invoiceId}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const actionLabels = {
        markPaid: "marked as paid",
        markUnpaid: "marked as unpaid",
        delete: "deleted",
        restore: "restored"
      }

      setSuccessMessage(`Invoice ${actionLabels[action as keyof typeof actionLabels]} successfully`)
      fetchInvoiceDetails() // Refresh data
    } catch (error) {
      console.error("Error updating invoice status:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to update invoice status"}`)
      } else {
        setError("An unexpected error occurred while updating invoice status")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      if (!paymentAmount || paymentAmount <= 0) {
        setError("Please enter a valid payment amount")
        setIsSaving(false)
        return
      }

      await axios.post(
        `/api/invoices/${invoiceId}`,
        {
          amount: paymentAmount,
          method: paymentMethod,
          notes: paymentNotes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccessMessage("Payment recorded successfully")
      setShowPaymentForm(false)
      setPaymentAmount(0)
      setPaymentMethod("cash")
      setPaymentNotes("")
      setActiveTab("payments")

      fetchInvoiceDetails() // Refresh data
    } catch (error) {
      console.error("Error recording payment:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to record payment"}`)
      } else {
        setError("An unexpected error occurred while recording payment")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    if (printRef.current && invoice) {
      const content = printRef.current
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Print Invoice</title>")
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: system-ui, -apple-system, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; }
          th { background-color: #f9fafb; }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write(content.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const calculateTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const calculateAmountDue = () => {
    if (!invoice) return 0
    return invoice.amount - calculateTotalPaid()
  }

  // Format date as DD MMM YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date)
  }

  // Show loading spinner
  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mb-2" />
              <span className="text-gray-600 font-medium">Loading invoice details...</span>
            </div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  // Show error state
  if (error && !invoice) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
              <Link href="/billing" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="mr-2" size={16} />
                <span>Back to Billing</span>
              </Link>
            </div>
            
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-rose-500 mr-2" />
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              href="/billing" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <ArrowLeft className="mr-1.5" size={18} />
              Back to Billing
            </Link>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Invoice #{invoice?.invoiceNumber}
              </h1>
              <div className="flex items-center mt-2 text-gray-500 space-x-3">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {invoice && formatDate(invoice.createdAt)}
                  </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center">
                  Due: {invoice && formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {invoice && !invoice.deleted && (
                <>
                  <StatusBadge status={invoice.status} />
                  {invoice.status === "unpaid" && (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="ml-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors
                      border border-emerald-200 px-3 py-1 rounded-lg text-sm flex items-center"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Add Payment
                    </button>
                  )}
                </>
              )}
              {invoice?.deleted && <StatusBadge status="deleted" />}
              
              <button
                onClick={handlePrint}
                className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors
                border border-blue-200 px-3 py-1 rounded-lg text-sm flex items-center"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print
              </button>
            </div>
          </div>
          
          {/* Notification Messages */}
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-rose-500 mr-2 flex-shrink-0" />
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md mb-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                <p className="text-emerald-700">{successMessage}</p>
              </div>
            </div>
          )}
          
          {invoice && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Tabs */}
                <div className="mb-4 border-b border-gray-200">
                  <div className="flex -mb-px space-x-6">
                    <button
                      className={`px-1 py-3 border-b-2 font-medium text-sm ${
                        activeTab === "details"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("details")}
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Invoice Details
                      </div>
                    </button>
                    <button
                      className={`px-1 py-3 border-b-2 font-medium text-sm ${
                        activeTab === "payments"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("payments")}
                    >
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payments
                        {payments.length > 0 && (
                          <span className="ml-1.5 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                            {payments.length}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Details Tab */}
                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Customer & Payment Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoCard title="Customer Information">
                        <div className="space-y-2">
                          <p className="text-gray-900 font-medium">{invoice.customerName}</p>
                          {invoice.customerPhone && (
                            <p className="text-gray-600 flex items-center">
                              <span className="text-gray-400 mr-2">Phone:</span>
                              {invoice.customerPhone}
                            </p>
                          )}
                          {customer?.email && (
                            <p className="text-gray-600 flex items-center">
                              <span className="text-gray-400 mr-2">Email:</span>
                              {customer.email}
                            </p>
                          )}
                          {customer?.address && (
                            <p className="text-gray-600 flex items-center">
                              <span className="text-gray-400 mr-2">Address:</span>
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </InfoCard>
                      
                      <InfoCard title="Payment Summary">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Subtotal:</span>
                            <span>KES {invoice.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Total Paid:</span>
                            <span className={payments.length > 0 ? "text-emerald-600" : ""}>
                              KES {calculateTotalPaid().toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="font-medium text-gray-900">Amount Due:</span>
                            <span className="font-medium text-lg text-gray-900">
                              KES {calculateAmountDue().toFixed(2)}
                            </span>
                          </div>
                          {invoice.status === "paid" && invoice.paidDate && (
                            <div className="text-xs text-emerald-600 mt-2">
                              Paid on {formatDate(invoice.paidDate)}
                            </div>
                          )}
                        </div>
                      </InfoCard>
                    </div>
                    
                    {/* Items Table */}
                    <InfoCard title="Invoice Items">
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qty
                              </th>
                              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Original Price
                              </th>
                              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actual Price
                              </th>
                              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {invoice.items.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-4 text-sm text-gray-900">{item.name}</td>
                                <td className="px-3 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                                <td className="px-3 py-4 text-sm text-gray-600 text-right">
                                  KES {item.price.toFixed(2)}
                                </td>
                                <td className="px-3 py-4 text-sm text-right">
                                  <div className="text-gray-900">
                                    KES {(item.adjustedPrice !== undefined ? item.adjustedPrice : item.price).toFixed(2)}
                                  </div>
                                  {item.adjustedPrice !== undefined && item.adjustedPrice < item.price && (
                                    <div className="text-xs text-emerald-600">
                                      ({(((item.price - item.adjustedPrice) / item.price) * 100).toFixed(0)}% discount)
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-900 font-medium text-right">
                                  KES {item.subtotal.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="px-3 py-3 text-sm font-medium text-gray-900 text-right">
                                Total:
                              </td>
                              <td className="px-3 py-3 text-sm font-medium text-gray-900 text-right">
                                KES {invoice.amount.toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </InfoCard>
                    
                    {/* Notes */}
                    <InfoCard title="Notes">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 
                        placeholder:text-gray-400 text-sm"
                        rows={3}
                        placeholder="Add notes about this invoice..."
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={handleSaveNotes}
                          disabled={isSaving}
                          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 
                          transition-colors text-white font-medium py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 
                          focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Notes
                            </>
                          )}
                        </button>
                      </div>
                    </InfoCard>
                  </div>
                )}
                
                {/* Payments Tab */}
                {activeTab === "payments" && (
                  <div className="space-y-6">
                    <InfoCard title="Payment History">
                      {payments.length > 0 ? (
                        <div className="overflow-x-auto -mx-5 px-5">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Method
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {payments.map((payment) => (
                                <tr key={payment._id.toString()} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {formatDate(payment.date)}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                                    ${payment.amount.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-600">
                                    {payment.notes || "-"}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td colSpan={1} className="px-3 py-3 text-sm font-medium text-gray-900">
                                  Total Paid:
                                </td>
                                <td className="px-3 py-3 text-sm font-medium text-emerald-700 text-right">
                                  KES {calculateTotalPaid().toFixed(2)}
                                </td>
                                <td colSpan={2}></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No payments recorded yet.</p>
                          {invoice.status === "unpaid" && (
                            <button
                              onClick={() => setShowPaymentForm(true)}
                              className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <PlusCircle className="h-4 w-4 mr-1.5" />
                              Record a payment
                            </button>
                          )}
                        </div>
                      )}
                    </InfoCard>
                    
                    {/* Payment Form */}
                    {showPaymentForm && (
                      <InfoCard title="Record Payment">
                        <form onSubmit={handleAddPayment}>
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Amount
                              </label>
                              <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <span className="text-gray-500 sm:text-sm">KES </span>
                                </div>
                                <input
                                  type="number"
                                  name="paymentAmount"
                                  id="paymentAmount"
                                  step="0.01"
                                  min="0.01"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                              </label>
                              <select
                                id="paymentMethod"
                                name="paymentMethod"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="check">Check</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            
                            <div>
                              <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                              </label>
                              <textarea
                                id="paymentNotes"
                                name="paymentNotes"
                                rows={2}
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="Add any additional payment details..."
                              />
                            </div>
                          </div>
                          
                          <div className="mt-5 flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowPaymentForm(false)}
                              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                  Processing...
                                </>
                              ) : (
                                "Record Payment"
                              )}
                            </button>
                          </div>
                        </form>
                      </InfoCard>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  {/* Invoice Actions */}
                  <InfoCard title="Invoice Actions">
                    <div className="space-y-3">
                      {!invoice.deleted && (
                        <>
                          {invoice.status === "unpaid" ? (
                            <ActionButton
                              icon={<CheckCircle className="h-4 w-4" />}
                              label="Mark as Paid"
                              onClick={() => handleStatusChange("markPaid")}
                              variant="success"
                              disabled={isSaving}
                              isLoading={isSaving}
                            />
                          ) : (
                            <ActionButton
                              icon={<XCircle className="h-4 w-4" />}
                              label="Mark as Unpaid"
                              onClick={() => handleStatusChange("markUnpaid")}
                              variant="warning"
                              disabled={isSaving}
                              isLoading={isSaving}
                            />
                          )}
                          
                          <ActionButton
                            icon={<Trash2 className="h-4 w-4" />}
                            label="Delete Invoice"
                            onClick={() => handleStatusChange("delete")}
                            variant="danger"
                            disabled={isSaving}
                            isLoading={isSaving}
                          />
                        </>
                      )}
                      
                      {invoice.deleted && (
                        <ActionButton
                          icon={<RotateCcw className="h-4 w-4" />}
                          label="Restore Invoice"
                          onClick={() => handleStatusChange("restore")}
                          variant="primary"
                          disabled={isSaving}
                          isLoading={isSaving}
                        />
                      )}
                    </div>
                  </InfoCard>
                  
                  {/* Print Preview */}
                  <div className="hidden">
                    <div ref={printRef}>
                      <Print 
                        invoice={invoice}
                        customer={customer}
                        payments={payments}
                        amountDue={calculateAmountDue()} inventory={[]} invoiceNumber={""} invoiceItems={[]} amount={0} dueDate={""} status={"paid"}                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}