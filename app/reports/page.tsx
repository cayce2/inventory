/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Calendar, Download, DollarSign, AlertTriangle, Clock, Check } from "lucide-react"

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
  const [unpaidInvoiceAmount, setUnpaidInvoiceAmount] = useState(0)
  const [overdueInvoiceAmount, setOverdueInvoiceAmount] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [useCustomDateRange, setUseCustomDateRange] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!useCustomDateRange) {
      fetchReportData(selectedPeriod)
    }
  }, [selectedPeriod])

  const fetchReportData = async (period: string, customStartDate?: string, customEndDate?: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const requestData =
        useCustomDateRange && customStartDate && customEndDate
          ? { customDateRange: true, startDate: customStartDate, endDate: customEndDate }
          : { period }

      const response = await axios.post("/api/reports", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setTotalIncome(response.data.totalIncome)
      setUnpaidInvoiceAmount(response.data.unpaidInvoiceAmount)
      setOverdueInvoiceAmount(response.data.overdueInvoiceAmount)
      setUnpaidInvoices(response.data.unpaidInvoices)
    } catch (error) {
      console.error("Error fetching report data:", error)
      setError("An error occurred while fetching report data. Please try again.")
    }
  }

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      fetchReportData("custom", startDate, endDate)
    } else {
      setError("Please select both start and end dates.")
    }
  }

  const handleDownloadReport = async () => {
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      let url = "/api/reports"
      if (useCustomDateRange && startDate && endDate) {
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      } else {
        url += `?period=${encodeURIComponent(selectedPeriod)}`
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        responseType: "blob",
      })

      // Check if the response is an error message in JSON format
      const contentType = response.headers["content-type"]
      if (contentType && contentType.includes("application/json")) {
        const errorText = await new Blob([response.data]).text()
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error || "Unknown error occurred")
      }

      // Create and trigger download
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", "inventory_report.xlsx")
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        link.remove()
      }, 100)
    } catch (error) {
      console.error("Error downloading report:", error)
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data instanceof Blob) {
          try {
            const errorText = await error.response.data.text()
            const errorJson = JSON.parse(errorText)
            setError(errorJson.error || "An error occurred while downloading the report. Please try again.")
          } catch (e) {
            setError(
              `Error (${error.response.status}): An error occurred while downloading the report. Please try again.`,
            )
          }
        } else {
          setError(
            `Error (${error.response.status}): ${error.response.data?.error || "An error occurred while downloading the report."}`,
          )
        }
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred while downloading the report. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Reports Dashboard</h1>
          <p className="text-slate-500 mt-2">View and analyze your business performance</p>
        </header>

        {/* Financial Summary Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Income</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">KES {totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <DollarSign className="text-emerald-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Unpaid Invoices</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">KES {unpaidInvoiceAmount.toFixed(2)}</p>
                </div>
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Clock className="text-amber-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-rose-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">KES {overdueInvoiceAmount.toFixed(2)}</p>
                </div>
                <div className="bg-rose-100 p-2 rounded-lg">
                  <AlertTriangle className="text-rose-500" size={24} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Date Filter Panel */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Date Range</h2>
            
            <div className="mb-4">
              <label className="inline-flex items-center mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomDateRange}
                  onChange={(e) => setUseCustomDateRange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-700">Custom date range</span>
              </label>

              {useCustomDateRange ? (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <Calendar className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                      placeholder="Start Date"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <Calendar className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                      placeholder="End Date"
                    />
                  </div>
                  <button
                    onClick={handleCustomDateFilter}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    Apply Filter
                  </button>
                </div>
              ) : (
                <div>
                  <label htmlFor="period" className="block mb-2 text-sm font-medium text-gray-700">
                    Select Period
                  </label>
                  <select
                    id="period"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">This Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Download Report Panel */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Download Report</h2>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
                <span className="font-medium">Error:</span> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <button
                  onClick={handleDownloadReport}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-medium rounded-lg text-sm px-5 py-3 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Download className="mr-2" size={16} />
                      Download Excel Report
                    </span>
                  )}
                </button>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-slate-700 mb-2">The report includes:</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 me-2 text-green-500" />
                    Inventory items with quantities and values
                    </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 me-2 text-green-500" />
                    Sales breakdown by period
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 me-2 text-green-500" />
                    Most popular items and low stock alerts
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Unpaid Invoices Table */}
        <section className="mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Unpaid Invoices</h2>
            
            {unpaidInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700">
                  <thead className="text-xs uppercase bg-slate-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 rounded-l-lg">Invoice #</th>
                      <th scope="col" className="px-6 py-3">Customer</th>
                      <th scope="col" className="px-6 py-3">Phone</th>
                      <th scope="col" className="px-6 py-3">Amount</th>
                      <th scope="col" className="px-6 py-3 rounded-r-lg">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidInvoices.map((invoice) => {
                      // Check if invoice is overdue
                      const dueDate = new Date(invoice.dueDate);
                      const today = new Date();
                      const isOverdue = dueDate < today;
                      
                      return (
                        <tr key={invoice._id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4">{invoice.customerName}</td>
                          <td className="px-6 py-4">{invoice.customerPhone}</td>
                          <td className="px-6 py-4 font-medium">KES {invoice.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                              isOverdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No unpaid invoices found for the selected period.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Tips Section */}
        <section className="mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">💡 Tips for Better Financial Management</h2>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <Check className="w-4 h-4 mt-1 me-2 text-blue-600 flex-shrink-0" />
                <span>Follow up on overdue invoices promptly to improve cash flow.</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 mt-1 me-2 text-blue-600 flex-shrink-0" />
                <span>Monitor inventory levels to avoid excess stock and minimize storage costs.</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 mt-1 me-2 text-blue-600 flex-shrink-0" />
                <span>Download reports monthly to track trends and adjust your business strategy accordingly.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </NavbarLayout>
  );
}