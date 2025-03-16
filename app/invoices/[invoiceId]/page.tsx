/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import NavbarLayout from "@/components/NavbarLayout"
import Print from "@/components/Print"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Printer, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Trash2, 
  RefreshCcw, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Home, 
  FileText,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Types
interface InvoiceItem {
  itemId: string
  quantity: number
  name: string
  price: number
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

// Component for the payment method badge
const PaymentMethodBadge = ({ method }: { method: string }) => {
  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'bg-emerald-100 text-emerald-800'
      case 'card': return 'bg-indigo-100 text-indigo-800'
      case 'bank': return 'bg-blue-100 text-blue-800'
      case 'mobile': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return '💵'
      case 'card': return '💳'
      case 'bank': return '🏦'
      case 'mobile': return '📱'
      default: return '💲'
    }
  }

  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(method)}`}>
      <span>{getMethodIcon(method)}</span>
      <span>{method.charAt(0).toUpperCase() + method.slice(1)}</span>
    </span>
  )
}

// Component for the status badge
const StatusBadge = ({ status, deleted }: { status: string, deleted?: boolean }) => {
  if (deleted) {
    return (
      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <Trash2 size={12} />
        DELETED
      </span>
    )
  }
  
  if (status === "paid") {
    return (
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <CheckCircle size={12} />
        PAID
      </span>
    )
  }
  
  return (
    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
      <AlertCircle size={12} />
      UNPAID
    </span>
  )
}

// Alert notification component
const Alert = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [onClose])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md flex items-center gap-3
        ${type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 
                             'bg-red-100 text-red-800 border-l-4 border-red-500'}`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <XCircle size={16} />
      </button>
    </motion.div>
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

      // If this is the first load and there's an amount due, pre-fill the payment amount
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
      setTimeout(() => setSuccessMessage(""), 5000)
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

      setSuccessMessage(
        `Invoice ${
          action === "markPaid"
            ? "marked as paid"
            : action === "markUnpaid"
              ? "marked as unpaid"
              : action === "delete"
                ? "deleted"
                : "restored"
        } successfully`,
      )

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
          body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; }
          th { background-color: #f9fafb; }
          .invoice-header { margin-bottom: 24px; }
          .invoice-footer { margin-top: 24px; }
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

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
            <span className="text-gray-600 font-medium">Loading invoice details...</span>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error && !invoice) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <Link href="/billing" className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
              <ArrowLeft className="mr-2" size={16} />
              Back to Billing
            </Link>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Notification system */}
        <AnimatePresence>
          {successMessage && (
            <Alert message={successMessage} type="success" onClose={() => setSuccessMessage("")} />
          )}
          
          {error && (
            <Alert message={error} type="error" onClose={() => setError("")} />
          )}
        </AnimatePresence>
        
        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/billing" className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
              <ArrowLeft className="mr-2" size={18} />
              Back to Billing
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md shadow-sm flex items-center transition-colors"
              >
                <Printer className="mr-2" size={18} />
                Print Invoice
              </button>

              {invoice && invoice.status === "unpaid" && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center transition-colors"
                >
                  <CreditCard className="mr-2" size={18} />
                  Record Payment
                </button>
              )}
            </div>
          </div>

          {invoice && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content - Invoice Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Invoice header card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="text-indigo-600" size={22} />
                          <h2 className="text-xl font-semibold text-gray-900">Invoice #{invoice.invoiceNumber}</h2>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-gray-500">
                            <Calendar size={14} className="mr-1.5" />
                            <span>Created: {new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', month: 'short', day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Calendar size={14} className="mr-1.5" />
                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                              year: 'numeric', month: 'short', day: 'numeric' 
                            })}</span>
                          </div>
                          {invoice.paidDate && (
                            <div className="flex items-center text-gray-500">
                              <Calendar size={14} className="mr-1.5" />
                              <span>Paid: {new Date(invoice.paidDate).toLocaleDateString('en-US', { 
                                year: 'numeric', month: 'short', day: 'numeric' 
                              })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={invoice.status} deleted={invoice.deleted} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="text-indigo-600 mr-2" size={18} />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <User className="text-gray-400 mt-0.5 mr-3" size={16} />
                        <div>
                          <p className="font-medium text-gray-900">{invoice.customerName}</p>
                        </div>
                      </div>
                      
                      {invoice.customerPhone && (
                        <div className="flex items-start">
                          <Phone className="text-gray-400 mt-0.5 mr-3" size={16} />
                          <p className="text-gray-600">{invoice.customerPhone}</p>
                        </div>
                      )}
                      
                      {customer && customer.email && (
                        <div className="flex items-start">
                          <Mail className="text-gray-400 mt-0.5 mr-3" size={16} />
                          <p className="text-gray-600">{customer.email}</p>
                        </div>
                      )}
                      
                      {customer && customer.address && (
                        <div className="flex items-start">
                          <Home className="text-gray-400 mt-0.5 mr-3" size={16} />
                          <p className="text-gray-600">{customer.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CreditCard className="text-indigo-600 mr-2" size={18} />
                      Payment Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">KES {invoice.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-medium text-green-600">KES {calculateTotalPaid().toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-100 my-2 pt-2"></div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Amount Due:</span>
                        <span className={`font-bold ${calculateAmountDue() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          KES {calculateAmountDue().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Items Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold">Items</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 text-right">
                              KES {item.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                              KES {item.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                            Total:
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                            KES {invoice.amount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="text-indigo-600 mr-2" size={18} />
                    Notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    rows={3}
                    placeholder="Add notes about this invoice..."
                  ></textarea>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
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

                {/* Payment History */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                      <CreditCard className="text-indigo-600 mr-2" size={18} />
                      Payment History
                    </h3>
                    {invoice.status === "unpaid" && !showPaymentForm && (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                      >
                        <CreditCard className="mr-1" size={14} />
                        Add Payment
                      </button>
                    )}
                  </div>

                  {/* Payment Form */}
                  <AnimatePresence>
                    {showPaymentForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-gray-200 overflow-hidden"
                      >
                        <div className="p-6 bg-gray-50">
                          <h4 className="text-md font-medium mb-4">Record Payment</h4>
                          <form onSubmit={handleAddPayment}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Payment Amount
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">KES </span>
                                  </div>
                                  <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Payment Method
                                </label>
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                >
                                  <option value="cash">Cash</option>
                                  <option value="card">Credit/Debit Card</option>
                                  <option value="bank">Bank Transfer</option>
                                  <option value="mobile">Mobile Payment</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                rows={2}
                                placeholder="Optional payment notes..."
                              ></textarea>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowPaymentForm(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
>
  Cancel
</button>
<button
  type="submit"
  disabled={isSaving}
  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSaving ? (
    <>
      <Loader2 className="animate-spin h-4 w-4 mr-2" />
      Saving...
    </>
  ) : (
    <>
      <CreditCard className="h-4 w-4 mr-2" />
      Record Payment
    </>
  )}
</button>
</div>
</form>
</div>
</motion.div>
)}
</AnimatePresence>

{payments.length === 0 ? (
  <div className="p-6 text-center text-gray-500">
    No payments recorded for this invoice yet.
  </div>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Method
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Amount
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Notes
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {payments.map((payment) => (
          <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-sm text-gray-900">
              {new Date(payment.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              <PaymentMethodBadge method={payment.method} />
            </td>
            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
              ${payment.amount.toFixed(2)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {payment.notes || "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
</div>
</div>

{/* Sidebar */}
<div className="space-y-6">
  {/* Action Card */}
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold mb-4">Actions</h3>
    <div className="space-y-3">
      {invoice.deleted ? (
        <button
          onClick={() => handleStatusChange("restore")}
          disabled={isSaving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
          )}
          Restore Invoice
        </button>
      ) : (
        <>
          {invoice.status === "unpaid" ? (
            <button
              onClick={() => handleStatusChange("markPaid")}
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Paid
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange("markUnpaid")}
              disabled={isSaving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md shadow-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Unpaid
            </button>
          )}
          <button
            onClick={() => handleStatusChange("delete")}
            disabled={isSaving}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-red-600 font-medium py-2 px-4 rounded-md shadow-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Invoice
          </button>
        </>
      )}
    </div>
  </div>

  {/* Printable preview hidden section */}
  <div className="hidden">
    <div ref={printRef}>
      {customer && <Print invoice={invoice} customer={customer} payments={payments} inventory={[]} items={[]} invoiceNumber={""} customerName={""} customerPhone={""} amount={0} dueDate={""} status={"paid"} />}
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