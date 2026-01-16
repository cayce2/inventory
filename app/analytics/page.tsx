/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { TrendingUp, Package, DollarSign, Star, Calendar, BarChart3, PieChart, Activity } from "lucide-react"

interface ItemAnalytics {
  _id: string
  name: string
  totalSold: number
  revenue: number
  averagePrice: number
  lastSold: string
}

interface AnalyticsData {
  itemSales: ItemAnalytics[]
  topPerformers: ItemAnalytics[]
  revenueByPeriod: { period: string; revenue: number }[]
  totalRevenue: number
  totalItemsSold: number
  averageOrderValue: number
}

const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("30days")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [useCustomDateRange, setUseCustomDateRange] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!useCustomDateRange) {
      fetchAnalytics(selectedPeriod)
    }
  }, [selectedPeriod])

  const fetchAnalytics = async (period: string, customStartDate?: string, customEndDate?: string) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const requestData = useCustomDateRange && customStartDate && customEndDate
        ? { customDateRange: true, startDate: customStartDate, endDate: customEndDate }
        : { period }

      const response = await axios.post("/api/analytics", requestData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setAnalytics(response.data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      fetchAnalytics("custom", startDate, endDate)
    }
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Sales Analytics</h1>
          <p className="text-slate-500 mt-2">Comprehensive insights into your business performance</p>
        </header>

        {/* Date Filter */}
        <section className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="inline-flex items-center cursor-pointer">
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
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full md:w-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 3 Months</option>
              <option value="thisYear">This Year</option>
              <option value="all">All Time</option>
            </select>
          ) : (
            <div className="flex flex-wrap gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCustomDateFilter}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Calendar size={16} />
                Apply Filter
              </button>
            </div>
          )}
        </section>

        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {formatCurrency(analytics?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <DollarSign className="text-emerald-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Items Sold</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {analytics?.totalItemsSold || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="text-blue-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Avg Order Value</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {formatCurrency(analytics?.averageOrderValue || 0)}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Activity className="text-purple-500" size={24} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Performing Items */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-emerald-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-700">Top Performing Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Units Sold</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Revenue</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.topPerformers.map((item, index) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Star className="text-yellow-500 fill-yellow-500" size={16} />}
                          <span className="font-medium text-slate-800">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.totalSold}</td>
                      <td className="py-3 px-4 font-medium text-emerald-600">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatCurrency(item.averagePrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* All Items Sales Analytics */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-blue-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-700">All Items Sales Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Total Sold</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Revenue</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Avg Price</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Last Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.itemSales.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.totalSold}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatCurrency(item.averagePrice)}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.lastSold ? new Date(item.lastSold).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Business Insights */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="text-purple-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-700">Business Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2">Sales Distribution</h3>
                <p className="text-sm text-slate-600">
                  Your top 5 items account for{" "}
                  <span className="font-bold text-blue-600">
                    {analytics?.topPerformers.length
                      ? (
                          (analytics.topPerformers.reduce((sum, item) => sum + item.revenue, 0) /
                            analytics.totalRevenue) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>{" "}
                  of total revenue
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2">Best Seller</h3>
                <p className="text-sm text-slate-600">
                  {analytics?.topPerformers[0]?.name || "N/A"} is your best-selling item with{" "}
                  <span className="font-bold text-emerald-600">
                    {analytics?.topPerformers[0]?.totalSold || 0} units
                  </span>{" "}
                  sold
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2">Revenue Leader</h3>
                <p className="text-sm text-slate-600">
                  {analytics?.topPerformers[0]?.name || "N/A"} generated the most revenue at{" "}
                  <span className="font-bold text-purple-600">
                    {formatCurrency(analytics?.topPerformers[0]?.revenue || 0)}
                  </span>
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2">Product Variety</h3>
                <p className="text-sm text-slate-600">
                  You have{" "}
                  <span className="font-bold text-amber-600">
                    {analytics?.itemSales.length || 0} different items
                  </span>{" "}
                  with sales activity
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </NavbarLayout>
  )
}
