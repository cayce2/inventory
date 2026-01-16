/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import NavbarLayout from "@/components/NavbarLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Package, DollarSign, AlertCircle, FileText, RefreshCw, TrendingUp, AlertTriangle, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface DashboardStats {
  totalItems: number;
  totalItemsTrend: number | null;
  lowStockItems: Array<{
    _id: string;
    name: string;
    quantity: number;
  }>;
  lowStockTrend: number | null;
  totalIncome: number;
  revenueTrend: number | null;
  unpaidInvoices: number;
  unpaidInvoicesTrend: number | null;
  trendData: Array<{ name: string; value: number }>;
  revenueByCategory?: Array<{ name: string; value: number }>;
  kpiData?: {
    inventoryTurnover: number;
    revenueTarget: number;
    invoiceCollection: number;
    stockCapacity: number;
  };
  fastMovingItems?: Array<{
    _id: string;
    name: string;
    quantity: number;
    soldQuantity: number;
    revenue: number;
  }>;
  slowMovingItems?: Array<{
    _id: string;
    name: string;
    quantity: number;
    soldQuantity: number;
    daysInStock: number;
  }>;
  stockValue?: number;
  avgSaleValue?: number;
  collectionRate?: number;
  lastUpdated?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
  trend?: number | null;
  loading: boolean;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
}

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalItemsTrend: null,
    lowStockItems: [],
    lowStockTrend: null,
    totalIncome: 0,
    revenueTrend: null,
    unpaidInvoices: 0,
    unpaidInvoicesTrend: null,
    trendData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const currency = 'KES';  

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDashboardStats(monthOffset);
  }, [router, monthOffset]);

  const fetchDashboardStats = async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`/api/dashboard?monthOffset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      setError("Failed to fetch dashboard data. Please try again later.");
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function that uses the current currency context
  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    loading, 
    bgColor, 
    iconBgColor, 
    iconColor 
  }: StatCardProps) => (
    <Card className={`border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-gray-700">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
            {description && !loading && (
              <p className="text-xs text-gray-600">{description}</p>
            )}
            {trend !== undefined && trend !== null && !loading && (
              <div className={`flex items-center text-xs ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${trend >= 0 ? '' : 'rotate-180'}`} />
                <span>{Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'} from last month</span>
              </div>
            )}
            {trend === null && !loading && (
              <p className="text-xs text-gray-500">No previous data for comparison</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header section with animated entrance */}
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Business Dashboard
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Get a quick overview of your business performance and inventory status
                </p>
                {stats.lastUpdated && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push('/analytics/enhanced')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Enhanced Analytics
                </Button>
                <Button 
                  onClick={() => fetchDashboardStats()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            <Separator className="mt-6" />
          </motion.div>

          {/* Error alert with animation */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Stats cards with staggered animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <StatCard
                title="Total Inventory"
                value={stats.totalItems}
                icon={Package}
                description={`${formatAmount(stats.stockValue || 0)} in stock`}
                trend={stats.totalItemsTrend}
                loading={loading}
                bgColor="bg-blue-50"
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <StatCard
                title="Low Stock Items"
                value={stats.lowStockItems.length}
                description="Items requiring immediate attention"
                icon={AlertTriangle}
                trend={stats.lowStockTrend}
                loading={loading}
                bgColor="bg-amber-50"
                iconBgColor="bg-amber-100"
                iconColor="text-amber-600"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <StatCard
                title="Total Revenue"  
                value={formatAmount(stats.totalIncome)}
                description="Year-to-date revenue"
                icon={DollarSign}
                trend={stats.revenueTrend}
                loading={loading}
                bgColor="bg-green-50"
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <StatCard
                title="Unpaid Invoices"
                value={stats.unpaidInvoices}
                description="Outstanding payments to collect"
                icon={FileText}
                trend={stats.unpaidInvoicesTrend}
                loading={loading}
                bgColor="bg-purple-50"
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
            </motion.div>
          </div>

          {/* KPI Section - if data exists 
          {stats.kpiData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mb-10"
            >
              <Card className="shadow-sm border border-gray-100">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-xl text-gray-900">Key Performance Indicators</CardTitle>
                  <CardDescription>Business performance metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="text-2xl font-bold text-gray-900">{stats.kpiData.inventoryTurnover}%</div>
                        <div className="text-sm text-gray-600">Inventory Turnover</div>
                      </div>
                      <Progress value={stats.kpiData.inventoryTurnover} className="h-2" />
                    </div>
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="text-2xl font-bold text-gray-900">{stats.kpiData.revenueTarget}%</div>
                        <div className="text-sm text-gray-600">Revenue Target</div>
                      </div>
                      <Progress value={stats.kpiData.revenueTarget} className="h-2" />
                    </div>
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="text-2xl font-bold text-gray-900">{stats.kpiData.invoiceCollection}%</div>
                        <div className="text-sm text-gray-600">Invoice Collection</div>
                      </div>
                      <Progress value={stats.kpiData.invoiceCollection} className="h-2" />
                    </div>
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="text-2xl font-bold text-gray-900">{stats.kpiData.stockCapacity}%</div>
                        <div className="text-sm text-gray-600">Stock Capacity</div>
                      </div>
                      <Progress value={stats.kpiData.stockCapacity} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
            */}
          {/* Main content with tabs */}
          <Tabs 
            defaultValue="overview" 
            className="mb-8 space-y-8"
          >
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 mx-auto bg-white-100 p-1 rounded-lg">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
              >
                Business Overview
              </TabsTrigger>
              <TabsTrigger 
                value="comparison"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
              >
                Comparison Data
              </TabsTrigger>
              <TabsTrigger 
                value="inventory"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
              >
                Inventory Management
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Revenue trend card */}
              <Card className="shadow-sm border border-gray-100 overflow-hidden">
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900">Revenue Trends</CardTitle>
                      <CardDescription>Monthly revenue performance over the past 6 months</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMonthOffset(monthOffset + 6)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMonthOffset(Math.max(0, monthOffset - 6))}
                        disabled={monthOffset === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px]">
                    {loading ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <Skeleton className="h-[300px] w-full rounded-lg" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={(value) => `${currency} ${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '8px', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              border: '1px solid #E5E7EB',
                              padding: '10px'
                            }}
                            formatter={(value: number) => [formatAmount(value), 'Revenue']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#6366F1" 
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            dot={{ stroke: '#4F46E5', strokeWidth: 2, fill: 'white', r: 4 }}
                            activeDot={{ stroke: '#4F46E5', strokeWidth: 2, fill: '#4F46E5', r: 6 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 py-3 px-6 border-t">
                  <div className="w-full flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Data updated on {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'N/A'}
                    </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => window.location.href = '/reports'}
                        >
                        View detailed report <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                  </div>
                </CardFooter>
              </Card>

            </TabsContent>
            
            <TabsContent value="comparison" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-xl text-gray-900">Fast Moving Items</CardTitle>
                    <CardDescription>Top selling products by quantity</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : !stats.fastMovingItems || stats.fastMovingItems.length === 0 ? (
                      <div className="text-center py-16">
                        <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-medium">No sales data available</p>
                        <p className="text-gray-500 text-sm mt-1">Start selling to see fast moving items</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-medium text-gray-700">Rank</TableHead>
                            <TableHead className="font-medium text-gray-700">Item</TableHead>
                            <TableHead className="font-medium text-gray-700">Stock</TableHead>
                            <TableHead className="font-medium text-gray-700 text-right">Sold</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.fastMovingItems.map((item, index) => (
                            <TableRow key={item._id} className="hover:bg-gray-50">
                              <TableCell className="font-bold text-indigo-600">#{index + 1}</TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.quantity} units</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-green-50 text-green-700 border-green-200">{item.soldQuantity}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-xl text-gray-900">Slow Moving Items</CardTitle>
                    <CardDescription>Items with low turnover rate</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : !stats.slowMovingItems || stats.slowMovingItems.length === 0 ? (
                      <div className="text-center py-16">
                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-medium">No slow moving items</p>
                        <p className="text-gray-500 text-sm mt-1">All items have good turnover</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-medium text-gray-700">Item</TableHead>
                            <TableHead className="font-medium text-gray-700">Stock</TableHead>
                            <TableHead className="font-medium text-gray-700">Days</TableHead>
                            <TableHead className="font-medium text-gray-700 text-right">Sold</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.slowMovingItems.map((item) => (
                            <TableRow key={item._id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.quantity} units</TableCell>
                              <TableCell>{item.daysInStock}d</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200">{item.soldQuantity}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg text-gray-900">Stock Value</CardTitle>
                    <CardDescription>Total inventory worth</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.stockValue || 0)}</p>
                        <p className="text-sm text-gray-500">Based on current inventory</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg text-gray-900">Avg. Sale Value</CardTitle>
                    <CardDescription>Per transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.avgSaleValue || 0)}</p>
                        <p className="text-sm text-gray-500">Average per invoice</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg text-gray-900">Collection Rate</CardTitle>
                    <CardDescription>Payment efficiency</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-3xl font-bold text-gray-900">{Math.round(stats.collectionRate || 0)}%</p>
                        <Progress value={stats.collectionRate || 0} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-6">
              {/* Inventory status card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="shadow-sm border border-gray-100 col-span-2">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-xl text-gray-900">Low Stock Alerts</CardTitle>
                    <CardDescription>Items that need to be restocked soon</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : stats.lowStockItems.length === 0 ? (
                      <div className="text-center py-16">
                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-medium">All items adequately stocked</p>
                        <p className="text-gray-500 text-sm mt-1">No low stock items detected</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="font-medium text-gray-700">Item Name</TableHead>
                              <TableHead className="font-medium text-gray-700">Stock Level</TableHead>
                              <TableHead className="font-medium text-gray-700">Status</TableHead>
                              <TableHead className="font-medium text-gray-700 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.lowStockItems.map((item) => (
                              <TableRow key={item._id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={(item.quantity / 20) * 100} className="h-2 w-24" />
                                    <span className="text-sm text-gray-700">{item.quantity} units</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                    Critical
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
                                    Restock
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  {!loading && stats.lowStockItems.length > 0 && (
                    <CardFooter className="bg-gray-50 py-3 px-6 border-t">
                      <Button variant="ghost" 
                        size="sm" 
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => window.location.href = '/inventory'}
                        >
                        View all inventory <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>

                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg text-gray-900">Inventory Health</CardTitle>
                    <CardDescription>Current stock status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <Skeleton className="h-[200px] w-full rounded-lg" />
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-3">
                            <Package className="h-6 w-6 text-indigo-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{stats.totalItems}</h3>
                          <p className="text-sm text-gray-500">Total items in stock</p>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Healthy Stock</span>
                            <span className="font-medium text-gray-900">
                              {stats.totalItems - stats.lowStockItems.length} items
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Low Stock</span>
                            <span className="font-medium text-red-600">
                              {stats.lowStockItems.length} items
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Stock Alert Threshold</span>
                            <span className="font-medium text-gray-900">10 units</span>
                          </div>
                        </div>

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                          Generate Restock Order
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </NavbarLayout>
  );
}