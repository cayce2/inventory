/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import NavbarLayout from "@/components/NavbarLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Package, DollarSign, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
  totalItems: number;
  lowStockItems: Array<{
    _id: string;
    name: string;
    quantity: number;
  }>;
  totalIncome: number;
  unpaidInvoices: number;
  trendData: Array<{ name: string; value: number }>; // added this to match the structure of trend data
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  loading: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: [],
    totalIncome: 0,
    unpaidInvoices: 0,
    trendData: [], // Initialize the trendData
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDashboardStats();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get("/api/dashboard", {
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

  const StatCard = ({ title, value, icon: Icon, color, bgColor, loading }: StatCardProps) => (
    <Card className={`border-none shadow-md ${bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-white/20`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your business overview</p>
            </div>
            <Button 
              onClick={fetchDashboardStats}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-all shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>

          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in-50 duration-300">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Inventory"
              value={stats.totalItems}
              icon={Package}
              color="text-blue-600"
              bgColor="bg-blue-50"
              loading={loading}
            />
            <StatCard
              title="Low Stock Items"
              value={stats.lowStockItems.length}
              icon={AlertCircle}
              color="text-amber-600"
              bgColor="bg-amber-50"
              loading={loading}
            />
            <StatCard
              title="Total Revenue"  
              value={`KES ${stats.totalIncome.toFixed(2)}`}
              icon={DollarSign}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
              loading={loading}
            />
            <StatCard
              title="Unpaid Invoices"
              value={stats.unpaidInvoices}
              icon={FileText}
              color="text-rose-600"
              bgColor="bg-rose-50"
              loading={loading}
            />
          </div>

          {/* Main content with tabs */}
          <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:w-fit mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card className="overflow-hidden shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-2">
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue for the past 6 months</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    {loading ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <Skeleton className="h-[250px] w-full rounded-lg" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '8px', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              border: 'none'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#4F46E5" 
                            strokeWidth={3}
                            dot={{ stroke: '#4F46E5', strokeWidth: 2, fill: 'white', r: 4 }}
                            activeDot={{ stroke: '#4F46E5', strokeWidth: 2, fill: '#4F46E5', r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-6">
              <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-2">
                  <CardTitle>Low Stock Items</CardTitle>
                  <CardDescription>Items that need to be restocked soon</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : stats.lowStockItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-600">No low stock items found</p>
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border border-gray-100">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-semibold">Item Name</TableHead>
                            <TableHead className="font-semibold">Quantity</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.lowStockItems.map((item) => (
                            <TableRow key={item._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.quantity}(remaining)</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                  Low Stock
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </NavbarLayout>
  );
}
