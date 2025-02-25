/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { ArrowDownToLine, AlertCircle, TrendingUp, CreditCard, Package } from "lucide-react"

interface ReportData {
  totalSales: number
  unpaidInvoices: Array<{
    _id: string
    invoiceNumber: string
    customerName: string
    amount: number
    dueDate: string
  }>
  lowStockItems: Array<{
    _id: string
    name: string
    quantity: number
  }>
  period: string
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchReportData()
  }, [period, router])

  const fetchReportData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get(`/api/reports?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReportData(response.data)
    } catch (error) {
      console.error("Error fetching report data:", error)
      setError("Failed to fetch report data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!reportData) return

    const workbook = XLSX.utils.book_new()

    // Total Sales
    const totalSalesWs = XLSX.utils.json_to_sheet([{ "Total Sales": reportData.totalSales }])
    XLSX.utils.book_append_sheet(workbook, totalSalesWs, "Total Sales")

    // Unpaid Invoices
    const unpaidInvoicesWs = XLSX.utils.json_to_sheet(reportData.unpaidInvoices)
    XLSX.utils.book_append_sheet(workbook, unpaidInvoicesWs, "Unpaid Invoices")

    // Low Stock Items
    const lowStockItemsWs = XLSX.utils.json_to_sheet(reportData.lowStockItems)
    XLSX.utils.book_append_sheet(workbook, lowStockItemsWs, "Low Stock Items")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    saveAs(data, `report_${reportData.period}.xlsx`)
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header and Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <p className="text-gray-500 mt-1">View and download your business metrics</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
                  className="w-full px-3 py-2 bg-transparent focus:outline-none"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
              
              {reportData && (
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowDownToLine size={18} />
                  <span>Export to Excel</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="w-full flex justify-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-200 mb-3"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Report Cards */}
          {reportData && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Sales Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">Total Sales</h2>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">${reportData.totalSales.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {period === "day" ? "Last 24 hours" : period === "week" ? "Past 7 days" : "Past 30 days"}
                </p>
              </div>

              {/* Unpaid Invoices Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">Unpaid Invoices</h2>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <CreditCard className="text-red-600" size={20} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reportData.unpaidInvoices.length}</p>
                <p className="text-sm text-gray-500 mt-2">Outstanding payments</p>
              </div>

              {/* Low Stock Items Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">Low Stock Items</h2>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Package className="text-amber-600" size={20} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reportData.lowStockItems.length}</p>
                <p className="text-sm text-gray-500 mt-2">Items need attention</p>
              </div>
            </div>
          )}

          {/* Detailed Information */}
          {reportData && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unpaid Invoices Detail */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Unpaid Invoices</h3>
                </div>
                {reportData.unpaidInvoices.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.unpaidInvoices.map((invoice) => (
                          <tr key={invoice._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.customerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              ${invoice.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">No unpaid invoices</div>
                )}
              </div>

              {/* Low Stock Items Detail */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Low Stock Items</h3>
                </div>
                {reportData.lowStockItems.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.lowStockItems.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.quantity === 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : item.quantity < 5 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.quantity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">No low stock items</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}