/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  ChevronLeft, 
  Calendar, 
  Download, 
  BarChart, 
  BarChart2, 
  PieChart, 
  RefreshCw,
  DollarSign,
  ShoppingCart,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar, Pie, Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

interface SalesData {
  dailySales: {
    date: string
    total: number
    count: number
  }[]
  topProducts: {
    itemId: string
    name: string
    quantity: number
    revenue: number
  }[]
  paymentMethods: {
    method: string
    count: number
    total: number
  }[]
  totalSales: number
  transactionCount: number
  averageTransaction: number
}

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export default function POSReportsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "payments">("overview")
  const currency = 'KES'; 
  const router = useRouter()

  useEffect(() => {
    // Set default date range to last 30 days
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    setEndDate(end.toISOString().split("T")[0])
    setStartDate(start.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchSalesData()
    }
  }, [startDate, endDate])

  const fetchSalesData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get(`/api/pos/reports?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSalesData(response.data)
    } catch (error) {
      console.error("Error fetching sales data:", error)
      setError("Failed to load sales reports")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = () => {
    // Implementation for exporting reports as PDF or Excel
    // Would typically use a library like jspdf or xlsx
    alert("Export functionality would be implemented here")
  }

  // Helper function that uses the current currency context
  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  // Chart data preparation
  const getDailySalesChartData = () => {
    if (!salesData) return null

    return {
      labels: salesData.dailySales.map((day) => new Date(day.date).toLocaleDateString()),
      datasets: [
        {
          label: "Sales Amount",
          data: salesData.dailySales.map((day) => day.total),
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          borderColor: "rgb(99, 102, 241)",
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
      ],
    }
  }

  const getPaymentMethodsChartData = () => {
    if (!salesData) return null

    return {
      labels: salesData.paymentMethods.map((method) => method.method.toUpperCase()),
      datasets: [
        {
          data: salesData.paymentMethods.map((method) => method.total),
          backgroundColor: [
            "rgba(249, 115, 22, 0.7)",
            "rgba(99, 102, 241, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
          ],
          borderColor: [
            "rgba(249, 115, 22, 1)",
            "rgba(99, 102, 241, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const getTopProductsChartData = () => {
    if (!salesData) return null

    return {
      labels: salesData.topProducts.map((product) => product.name),
      datasets: [
        {
          label: "Revenue",
          data: salesData.topProducts.map((product) => product.revenue),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }
  }

  // Date range presets
  const setDateRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    setEndDate(end.toISOString().split("T")[0])
    setStartDate(start.toISOString().split("T")[0])
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sales Analytics</h1>
              <p className="text-gray-500 mt-1">
                {startDate && endDate ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` : "Select date range"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSalesData()}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center hover:bg-gray-200 transition"
              >
                <RefreshCw className="mr-1" size={16} />
                Refresh
              </button>
              <Link href="/pos" className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg flex items-center hover:bg-indigo-100 transition">
                <ChevronLeft className="mr-1" size={16} />
                Back to POS
              </Link>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setDateRange(7)} 
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  >
                    7 days
                  </button>
                  <button 
                    onClick={() => setDateRange(30)} 
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  >
                    30 days
                  </button>
                  <button 
                    onClick={() => setDateRange(90)} 
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  >
                    90 days
                  </button>
                  <button 
                    onClick={() => {
                      const now = new Date()
                      const start = new Date(now.getFullYear(), now.getMonth(), 1)
                      setStartDate(start.toISOString().split("T")[0])
                      setEndDate(now.toISOString().split("T")[0])
                    }}
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  >
                    This month
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={handleExportReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center hover:bg-indigo-700 transition w-full justify-center"
                  disabled={!salesData || isLoading}
                >
                  <Download className="mr-2" size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-1">Please try again or contact support if the issue persists.</p>
            </div>
          ) : salesData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition hover:shadow-md">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Sales</p>
                      <h2 className="text-3xl font-bold text-gray-800">{formatAmount(salesData.totalSales)}</h2>
                      <p className="text-xs text-gray-500 mt-2">
                        From {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-indigo-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center">
                      <DollarSign className="text-indigo-600" size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition hover:shadow-md">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Transaction Count</p>
                      <h2 className="text-3xl font-bold text-gray-800">{salesData.transactionCount}</h2>
                      <p className="text-xs text-gray-500 mt-2">Total number of sales</p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center">
                      <ShoppingCart className="text-orange-600" size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition hover:shadow-md">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Average Sale</p>
                      <h2 className="text-3xl font-bold text-gray-800">{formatAmount(salesData.averageTransaction)}</h2>
                      <p className="text-xs text-gray-500 mt-2">Average transaction value</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 h-12 w-12 flex items-center justify-center">
                      <CreditCard className="text-green-600" size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-6 py-4 text-sm font-medium transition ${
                      activeTab === "overview" 
                        ? "text-indigo-600 border-b-2 border-indigo-600" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`px-6 py-4 text-sm font-medium transition ${
                      activeTab === "products" 
                        ? "text-indigo-600 border-b-2 border-indigo-600" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`px-6 py-4 text-sm font-medium transition ${
                      activeTab === "payments" 
                        ? "text-indigo-600 border-b-2 border-indigo-600" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Payment Methods
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <BarChart className="mr-2 text-indigo-500" size={20} />
                      Daily Sales Trend
                    </h2>
                    <div className="h-80">
                      {getDailySalesChartData() && (
                        <Line
                          data={getDailySalesChartData()!}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                backgroundColor: 'rgba(53, 53, 53, 0.8)',
                                bodyFont: {
                                  family: 'Inter, system-ui, sans-serif',
                                },
                                titleFont: {
                                  family: 'Inter, system-ui, sans-serif',
                                  weight: 'bold'
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  display: true,
                                  color: 'rgba(0, 0, 0, 0.05)',
                                },
                                ticks: {
                                  callback: function(value) {
                                    // Fixed: Use actual function instead of string
                                    return formatAmount(value as number);
                                  }
                                }
                              },
                              x: {
                                grid: {
                                  display: false
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <div className="grid grid-cols-1 gap-6 mb-6">
                  {/* Top Products Chart */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <BarChart2 className="mr-2 text-green-500" size={20} />
                      Top Selling Products by Revenue
                    </h2>
                    <div className="h-80">
                      {getTopProductsChartData() && (
                        <Bar
                          data={getTopProductsChartData()!}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                backgroundColor: 'rgba(53, 53, 53, 0.8)',
                                bodyFont: {
                                  family: 'Inter, system-ui, sans-serif',
                                },
                                titleFont: {
                                  family: 'Inter, system-ui, sans-serif',
                                  weight: 'bold'
                                }
                              }
                            },
                            scales: {
                              x: {
                                beginAtZero: true,
                                grid: {
                                  display: true,
                                  color: 'rgba(0, 0, 0, 0.05)',
                                },
                                ticks: {
                                  callback: function(value) {
                                    // Updated to use formatAmount
                                    return formatAmount(value as number);
                                  }
                                }
                              },
                              y: {
                                grid: {
                                  display: false
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity Sold
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenue
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg. Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {salesData.topProducts.map((product) => (
                            <tr key={product.itemId} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">ID: {product.itemId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{product.quantity}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatAmount(product.revenue)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">
                                  {formatAmount(product.revenue / product.quantity)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Payment Methods Chart */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <PieChart className="mr-2 text-indigo-500" size={20} />
                      Payment Methods
                    </h2>
                    <div className="h-64">
                      {getPaymentMethodsChartData() && (
                        <Pie
                          data={getPaymentMethodsChartData()!}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "right",
                                labels: {
                                  font: {
                                    family: 'Inter, system-ui, sans-serif',
                                  },
                                  usePointStyle: true,
                                  padding: 20,
                                }
                              },
                              tooltip: {
                                backgroundColor: 'rgba(53, 53, 53, 0.8)',
                                bodyFont: {
                                  family: 'Inter, system-ui, sans-serif',
                                },
                                titleFont: {
                                  family: 'Inter, system-ui, sans-serif',
                                  weight: 'bold'
                                }
                              }
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Payment Methods Table */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Method Details</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transactions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg. Transaction
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {salesData.paymentMethods.map((method) => (
                            <tr key={method.method} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{method.method.toUpperCase()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{method.count}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatAmount(method.total)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">
                                  {formatAmount(method.total / method.count)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <BarChart className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">No sales data available</h3>
              <p className="text-gray-500">Select a date range to view sales reports</p>
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}