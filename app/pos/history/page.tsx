/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Search, FileText, Eye, X, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface SaleItem {
  itemId: string
  name: string
  quantity: number
  price: number
}

interface Sale {
  _id: string
  items: SaleItem[]
  total: number
  payment: {
    method: string
    amountTendered: number
    cardDetails?: {
      last4: string
      type: string
    }
  }
  timestamp: string
  status: string
}

export default function POSHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 20
  const router = useRouter()

  useEffect(() => {
    fetchSalesHistory()
  }, [currentPage])

  const fetchSalesHistory = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // Calculate pagination
      const skip = (currentPage - 1) * itemsPerPage

      // Build query parameters
      let query = `?limit=${itemsPerPage}&skip=${skip}`
      if (startDate) query += `&startDate=${startDate}`
      if (endDate) query += `&endDate=${endDate}`

      const response = await axios.get(`/api/pos/sales${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSales(response.data.sales)
      setTotalCount(response.data.pagination.total)
    } catch (error) {
      console.error("Error fetching sales history:", error)
      setError("Failed to load sales history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchFilter = () => {
    setCurrentPage(1)
    fetchSalesHistory()
    setShowFilters(false)
  }

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowSaleModal(true)
  }

  const handleExportCSV = () => {
    // Implementation for exporting data to CSV
    if (sales.length === 0) return

    const csvHeader = "Date,Time,Transaction ID,Items,Total,Payment Method\n"

    const csvRows = sales.map((sale) => {
      const date = new Date(sale.timestamp).toLocaleDateString()
      const time = new Date(sale.timestamp).toLocaleTimeString()
      const itemsSummary = sale.items.map((item) => `${item.quantity}x ${item.name}`).join("; ")
      const total = sale.total.toFixed(2)
      const paymentMethod = sale.payment.method

      return `${date},${time},${sale._id},${itemsSummary},${total},${paymentMethod}`
    })

    const csvContent = csvHeader + csvRows.join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `sales_history_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const filteredSales = searchTerm
    ? sales.filter(
        (sale) =>
          sale._id.includes(searchTerm) ||
          sale.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          sale.payment.method.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : sales

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const getPaymentBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'card':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  const SaleDetailModal = () => {
    if (!showSaleModal || !selectedSale) return null

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-lg font-semibold">Sale Details</h2>
            <button 
              onClick={() => setShowSaleModal(false)} 
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="font-medium text-sm truncate">{selectedSale._id}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                <p className="font-medium text-sm">
                  {new Date(selectedSale.timestamp).toLocaleDateString()}{" "}
                  {new Date(selectedSale.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Items</h3>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-200">
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="px-4 py-3 flex justify-between">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="my-5 pt-2 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>

            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Information</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeColor(selectedSale.payment.method)}`}>
                    {selectedSale.payment.method}
                  </span>
                </div>

                {selectedSale.payment.method === "cash" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Tendered:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.payment.amountTendered)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Change:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.payment.amountTendered - selectedSale.total)}</span>
                    </div>
                  </div>
                )}

                {selectedSale.payment.method === "card" && selectedSale.payment.cardDetails && (
                  <div className="text-sm text-gray-600">
                    {selectedSale.payment.cardDetails.type} ending in {selectedSale.payment.cardDetails.last4}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t flex justify-end">
            <button 
              onClick={() => setShowSaleModal(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors rounded-lg font-medium text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const FiltersModal = () => {
    if (!showFilters) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden">
        <div className="bg-white h-full w-full max-w-md ml-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={18} />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={18} />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <button
              onClick={handleSearchFilter}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-bold text-gray-900">Sales History</h1>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(true)} 
                  className="lg:hidden flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Filter size={18} />
                </button>
                <Link 
                  href="/pos" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} />
                  Back to POS
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters - Desktop */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="date"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center">
              <button
                onClick={handleSearchFilter}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors text-sm font-medium"
              >
                <Filter className="mr-2" size={16} />
                Apply Filters
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center transition-colors text-sm font-medium"
                disabled={sales.length === 0}
              >
                <Download className="mr-2" size={16} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="lg:hidden mb-6">
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-colors font-medium"
              disabled={sales.length === 0}
            >
              <Download className="mr-2" size={18} />
              Export CSV
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm border">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 flex items-center">
              <span className="font-medium">{error}</span>
            </div>
          ) : filteredSales.length > 0 ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSales.map((sale) => (
                        <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{new Date(sale.timestamp).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600">{sale._id.substring(0, 8)}...</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {sale.items.length} {sale.items.length === 1 ? "item" : "items"}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {sale.items
                                .slice(0, 2)
                                .map((item) => `${item.quantity}x ${item.name}`)
                                .join(", ")}
                              {sale.items.length > 2 ? "..." : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full capitalize ${getPaymentBadgeColor(sale.payment.method)}`}>
                              {sale.payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button 
                              onClick={() => handleViewSale(sale)} 
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-700 order-2 sm:order-1">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{" "}
                  <span className="font-medium">{totalCount}</span> results
                </div>

                <div className="flex items-center space-x-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="px-4 py-2 border rounded-lg bg-gray-50 text-sm font-medium">
                    {currentPage} / {totalPages || 1}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                    disabled={currentPage >= totalPages}
                    className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
              <p className="text-gray-500 max-w-sm">
                {startDate || endDate
                  ? "Try adjusting your search filters or dates to find what you're looking for."
                  : "Start making sales to see your transaction history here."}
              </p>
            </div>
          )}
        </div>

        <SaleDetailModal />
        <FiltersModal />
      </div>
    </NavbarLayout>
  )
}