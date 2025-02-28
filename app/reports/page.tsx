/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { ArrowDownToLine, Calendar, DollarSign, FileBarChart, AlertCircle, Clock } from "lucide-react"

interface UnpaidInvoice {
  _id: string
  customerName: string
  customerPhone: string
  invoiceNumber: string
  amount: number
  dueDate: string
  items: Array<{ name: string; quantity: number }>
}

export default function Reports() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [totalIncome, setTotalIncome] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  // Calculate total unpaid amount
  const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)

  // Calculate overdue invoices
  const today = new Date()
  const overdueInvoices = unpaidInvoices.filter(
    invoice => new Date(invoice.dueDate) < today
  )

  useEffect(() => {
    fetchReportData(selectedPeriod)
  }, [selectedPeriod])

  const fetchReportData = async (period: string) => {
    setIsLoading(true)
    setError("")
    
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.post(
        "/api/reports",
        { period },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setTotalIncome(response.data.totalIncome)
      setUnpaidInvoices(response.data.unpaidInvoices)
    } catch (error) {
      console.error("Error fetching report data:", error)
      setError("An error occurred while fetching report data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `inventory_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Error downloading report:", error)
      setError("An error occurred while downloading the report. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }
    return date.toLocaleDateString(undefined, options)
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    if (due > today) return null
    
    const diffTime = Math.abs(today.getTime() - due.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "day": return "Today"
      case "week": return "This Week"
      case "month": return "This Month"
      default: return "All Time"
    }
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <p className="mt-1 text-sm text-gray-500">Monitor your income and outstanding invoices</p>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4">
                <button
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {isDownloading ? (
                    <>
                      <Clock className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="-ml-1 mr-2 h-4 w-4" />
                      Export Excel Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("unpaid")}
                className={`${
                  activeTab === "unpaid"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Unpaid Invoices {unpaidInvoices.length > 0 && `(${unpaidInvoices.length})`}
              </button>
            </nav>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div>
              <div className="mb-6">
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Reporting Period
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="period"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="rounded-full bg-gray-200 h-12 w-12 mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Total Income Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
                            <dd>
                              <div className="text-lg font-bold text-gray-900">{formatCurrency(totalIncome)}</div>
                              <div className="text-xs text-gray-500">{getPeriodLabel()}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outstanding Amount Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                          <FileBarChart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Unpaid Invoices</dt>
                            <dd>
                              <div className="text-lg font-bold text-gray-900">{formatCurrency(totalUnpaid)}</div>
                              <div className="text-xs text-gray-500">{unpaidInvoices.length} invoice(s)</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overdue Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Overdue Invoices</dt>
                            <dd>
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
                              </div>
                              <div className="text-xs text-gray-500">{overdueInvoices.length} invoice(s)</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unpaid Invoices tab */}
          {activeTab === "unpaid" && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Unpaid Invoices</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {unpaidInvoices.length} unpaid {unpaidInvoices.length === 1 ? 'invoice' : 'invoices'} totaling {formatCurrency(totalUnpaid)}
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-pulse space-y-4 w-full">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No unpaid invoices</h3>
                  <p className="mt-1 text-sm text-gray-500">All your invoices have been paid.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unpaidInvoices.map((invoice) => {
                        const daysOverdue = getDaysOverdue(invoice.dueDate);
                        const isOverdue = daysOverdue !== null;
                        
                        return (
                          <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{invoice.customerName}</div>
                                  {invoice.customerPhone && (
                                    <div className="text-sm text-gray-500">{invoice.customerPhone}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{invoice.invoiceNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                  {formatDate(invoice.dueDate)}
                                </div>
                                {isOverdue && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.amount)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {invoice.items && invoice.items.length > 0 ? (
                                  <ul className="divide-y divide-gray-200">
                                    {invoice.items.map((item, index) => (
                                      <li key={index} className="py-1">
                                        <div className="flex items-center">
                                          <span className="font-medium">{item.name}</span>
                                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            Qty: {item.quantity}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-gray-500">No items</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}