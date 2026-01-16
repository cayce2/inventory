/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const formatCurrency = (value: number) => `KES ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']

export default function EnhancedAnalytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')
  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get(`/api/analytics/enhanced?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(response.data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </NavbarLayout>
    )
  }

  const MetricCard = ({ title, value, change, icon: Icon, positive }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
                {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{Math.abs(change).toFixed(1)}% vs previous period</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${positive ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Icon className={positive ? 'text-green-600' : 'text-blue-600'} size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Enhanced Analytics</h1>
              <p className="text-slate-600 mt-1">Comprehensive business insights and metrics</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Profit Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Profit & Margins</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Revenue"
                value={formatCurrency(data?.profitMetrics?.revenue || 0)}
                change={data?.comparisons?.revenueChange}
                icon={DollarSign}
                positive={data?.comparisons?.revenueChange >= 0}
              />
              <MetricCard
                title="Cost of Goods Sold"
                value={formatCurrency(data?.profitMetrics?.cogs || 0)}
                icon={Package}
              />
              <MetricCard
                title="Gross Profit"
                value={formatCurrency(data?.profitMetrics?.grossProfit || 0)}
                icon={TrendingUp}
                positive={data?.profitMetrics?.grossProfit > 0}
              />
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Profit Margin</p>
                    <p className="text-2xl font-bold">{data?.profitMetrics?.profitMargin?.toFixed(1)}%</p>
                    {data?.comparisons?.profitMarginChange !== undefined && (
                      <div className={`flex items-center text-sm ${data.comparisons.profitMarginChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.comparisons.profitMarginChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{Math.abs(data.comparisons.profitMarginChange).toFixed(1)}% change</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Time-Based Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Sales Trends</CardTitle>
              <CardDescription>Daily performance over selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.timeTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="units" stroke="#10B981" strokeWidth={2} name="Units Sold" />
                  <Line yAxisId="left" type="monotone" dataKey="aov" stroke="#F59E0B" strokeWidth={2} name="Avg Order Value" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Customer Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Customers"
                value={data?.customerMetrics?.totalCustomers || 0}
                change={data?.comparisons?.customerChange}
                icon={Users}
                positive={data?.comparisons?.customerChange >= 0}
              />
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">New Customers</p>
                    <p className="text-2xl font-bold text-green-600">{data?.customerMetrics?.newCustomers || 0}</p>
                    <p className="text-xs text-slate-500">First-time buyers</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Returning Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{data?.customerMetrics?.returningCustomers || 0}</p>
                    <p className="text-xs text-slate-500">Repeat buyers</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Customer LTV</p>
                    <p className="text-2xl font-bold">{formatCurrency(data?.customerMetrics?.ltv || 0)}</p>
                    <p className="text-xs text-slate-500">Lifetime value estimate</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sales Velocity & Product Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Velocity</CardTitle>
                <CardDescription>Inventory turnover rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.salesVelocity?.slice(0, 5).map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-slate-600">Stock: {item.currentStock} | Sold: {item.soldLast30Days}</p>
                      </div>
                      <Badge className={
                        item.velocity === 'Fast' ? 'bg-green-100 text-green-700' :
                        item.velocity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {item.velocity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Mix Analysis</CardTitle>
                <CardDescription>Revenue by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data?.productMix || []}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.percentage.toFixed(0)}%`}
                    >
                      {data?.productMix?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Period Comparison Summary */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle>Period-over-Period Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Revenue Change</p>
                  <p className={`text-2xl font-bold ${data?.comparisons?.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.comparisons?.revenueChange >= 0 ? '+' : ''}{data?.comparisons?.revenueChange?.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Units Change</p>
                  <p className={`text-2xl font-bold ${data?.comparisons?.unitsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.comparisons?.unitsChange >= 0 ? '+' : ''}{data?.comparisons?.unitsChange?.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Customer Growth</p>
                  <p className={`text-2xl font-bold ${data?.comparisons?.customerChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.comparisons?.customerChange >= 0 ? '+' : ''}{data?.comparisons?.customerChange?.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Margin Change</p>
                  <p className={`text-2xl font-bold ${data?.comparisons?.profitMarginChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.comparisons?.profitMarginChange >= 0 ? '+' : ''}{data?.comparisons?.profitMarginChange?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </NavbarLayout>
  )
}
