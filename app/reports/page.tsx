/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Calendar, Download, DollarSign, AlertTriangle, Clock, Check, Lock, Eye, EyeOff, Settings, Upload, FileDown, TrendingUp, BarChart3 } from "lucide-react"
import Link from "next/link"

interface UnpaidInvoice {
  _id: string
  customerName: string
  customerPhone: string
  invoiceNumber: string
  amount: number
  dueDate: string
  items: Array<{ name: string; quantity: number }>
}

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

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
  const [itemSalesSummary, setItemSalesSummary] = useState<any[]>([])
  
  // Password protection states
  const [downloadPassword, setDownloadPassword] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false)
  const [hasReportPassword, setHasReportPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Import/Export states
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResult, setImportResult] = useState<string>("")  
  
  const currency = 'KES'
  const router = useRouter()

  useEffect(() => {
    checkReportPasswordStatus()
  }, [])

  useEffect(() => {
    if (!useCustomDateRange) {
      fetchReportData(selectedPeriod)
    }
  }, [selectedPeriod])

  const checkReportPasswordStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.patch("/api/reports", {}, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setHasReportPassword(response.data.hasReportPassword)
    } catch (error) {
      console.error("Error checking password status:", error)
    }
  }

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
      setItemSalesSummary(response.data.itemSalesSummary || [])
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

  const handleSetupPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const requestData: any = { password: newPassword }
      if (hasReportPassword && currentPassword) {
        requestData.currentPassword = currentPassword
      }

      await axios.put("/api/reports", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setHasReportPassword(true)
      setShowPasswordSetupModal(false)
      setNewPassword("")
      setCurrentPassword("")
      setConfirmPassword("")
      setError("")
      alert("Report password updated successfully!")
    } catch (error) {
      console.error("Error setting up password:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data?.error || "Failed to update password")
      } else {
        setError("An error occurred while updating the password")
      }
    }
  }

  const handleDownloadWithPassword = async () => {
    if (!downloadPassword) {
      setError("Please enter the download password")
      return
    }

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
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&password=${encodeURIComponent(downloadPassword)}`
      } else {
        url += `?period=${encodeURIComponent(selectedPeriod)}&password=${encodeURIComponent(downloadPassword)}`
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

      // Close modal and reset password
      setShowPasswordModal(false)
      setDownloadPassword("")
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

  const handleDownloadReport = () => {
    if (!hasReportPassword) {
      setShowPasswordSetupModal(true)
      return
    }
    setShowPasswordModal(true)
  }

  const handleExportInventory = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get("/api/inventory/export", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "inventory_export.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting inventory:", error)
      setError("Failed to export inventory")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportInventory = async () => {
    if (!importFile) {
      setError("Please select a CSV file to import")
      return
    }

    setIsImporting(true)
    setError("")
    setImportResult("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const formData = new FormData()
      formData.append("file", importFile)

      const response = await axios.post("/api/inventory/import", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      })

      setImportResult(response.data.message)
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Import completed with errors: ${response.data.errors.join(", ")}`)
      }
      setImportFile(null)
    } catch (error) {
      console.error("Error importing inventory:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data?.error || "Failed to import inventory")
      } else {
        setError("Failed to import inventory")
      }
    } finally {
      setIsImporting(false)
    }
  }

  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Reports Dashboard</h1>
              <p className="text-slate-500 mt-2">View and analyze your business performance</p>
            </div>
            <Link
              href="/analytics"
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 size={20} />
              View Analytics
            </Link>
          </div>
        </header>

        {/* Financial Summary Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Income</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1"> {formatAmount(totalIncome)}</p>
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
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmount(unpaidInvoiceAmount)}</p>
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
                  <p className="text-2xl font-bold text-slate-800 mt-1"> {formatAmount(overdueInvoiceAmount)}</p>
                </div>
                <div className="bg-rose-100 p-2 rounded-lg">
                  <AlertTriangle className="text-rose-500" size={24} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Item Sales Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Item Sales Summary</h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            {itemSalesSummary.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Item Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Total Sold</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemSalesSummary.map((item) => (
                      <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.totalSold}</td>
                        <td className="py-3 px-4 font-medium text-emerald-600">{formatAmount(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">No sales data available for the selected period</p>
              </div>
            )}
          </div>
        </section>

        {/* Import/Export Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Import & Export Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-medium text-slate-800 mb-3">Export Inventory</h3>
              <p className="text-sm text-slate-600 mb-4">Download all your inventory items as a CSV file</p>
              <button
                onClick={handleExportInventory}
                disabled={isExporting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    Export CSV
                  </>
                )}
              </button>
            </div>

            {/* Import Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-medium text-slate-800 mb-3">Import Inventory</h3>
              <p className="text-sm text-slate-600 mb-4">Upload a CSV file with columns: Name, SKU, Quantity, Price, Low Stock Threshold</p>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                />
                <button
                  onClick={handleImportInventory}
                  disabled={isImporting || !importFile}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import CSV
                    </>
                  )}
                </button>
              </div>
              {importResult && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{importResult}</p>
                </div>
              )}
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
                <span className="ml-3 text-sm font-medium text-slate-700">Custom Date Range</span>
              </label>
            </div>

            {!useCustomDateRange ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Select Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 3 Months</option>
                  <option value="thisYear">This Year</option>
                  <option value="lastYear">Last Year</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleCustomDateFilter}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Apply Filter
                </button>
              </div>
            )}

            {/* Download Section */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-700">Export Report</h3>
                <button
                  onClick={() => setShowPasswordSetupModal(true)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Password Settings"
                >
                  <Settings size={16} />
                </button>
              </div>
              <button
                onClick={handleDownloadReport}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Download size={16} />
                Download Excel Report
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {hasReportPassword ? "Password protected" : "Setup password first"}
              </p>
            </div>
          </div>

          {/* Unpaid Invoices Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-700">Unpaid Invoices</h2>
              <span className="bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
                {unpaidInvoices.length} Invoice{unpaidInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Check className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">All Caught Up!</h3>
                <p className="text-slate-500">No unpaid invoices at the moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Invoice #</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Due Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidInvoices.map((invoice) => {
                      const isOverdue = new Date(invoice.dueDate) < new Date()
                      return (
                        <tr key={invoice._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-800">{invoice.invoiceNumber}</td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-slate-800">{invoice.customerName}</div>
                              <div className="text-sm text-slate-500">{invoice.customerPhone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">{formatAmount(invoice.amount)}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isOverdue
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isOverdue ? "Overdue" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-rose-50 border border-rose-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="text-rose-500 mr-2" size={20} />
              <p className="text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Password Setup Modal */}
        {showPasswordSetupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  {hasReportPassword ? "Update Report Password" : "Setup Report Password"}
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordSetupModal(false)
                    setError("")
                    setNewPassword("")
                    setCurrentPassword("")
                    setConfirmPassword("")
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {hasReportPassword && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordSetupModal(false)
                    setError("")
                    setNewPassword("")
                    setCurrentPassword("")
                    setConfirmPassword("")
                  }}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetupPassword}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {hasReportPassword ? "Update" : "Setup"} Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Download Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Enter Download Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setDownloadPassword("")
                    setError("")
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={downloadPassword}
                  onChange={(e) => setDownloadPassword(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password to download report"
                  onKeyPress={(e) => e.key === 'Enter' && handleDownloadWithPassword()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setDownloadPassword("")
                    setError("")
                  }}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadWithPassword}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NavbarLayout>
  )
}