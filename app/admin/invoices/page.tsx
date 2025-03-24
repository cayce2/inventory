"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  RefreshCcw, 
  Search, 
  ArrowLeft, 
  MoreHorizontal,
  AlertCircle
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  status: "paid" | "unpaid"
  createdAt: string
  deleted: boolean
  userId: string
  userName?: string
  userEmail?: string
}

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const currency = 'KES';
  const router = useRouter()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/admin/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInvoices(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      setError("An error occurred while fetching invoices")
      setIsLoading(false)
    }
  }

  const handleInvoiceAction = async (invoiceId: string, action: string) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `/api/admin/invoices/${invoiceId}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      fetchInvoices()
    } catch (error) {
      console.error(`Error performing action on invoice:`, error)
      setError(`An error occurred while performing the action`)
    }
  }

  const filteredInvoices = invoices.filter(
    (invoice) =>
      (showDeleted || !invoice.deleted) &&
      (statusFilter === "all" || invoice.status === statusFilter) &&
      ((invoice.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.customerPhone || '').includes(searchTerm) ||
        (invoice.invoiceNumber || '').includes(searchTerm) ||
        (invoice.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.userEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase())),
  )

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = filteredInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const unpaidAmount = filteredInvoices
    .filter((invoice) => invoice.status === "unpaid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Invoice Management</h1>
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-48" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Invoice Management</h1>
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </NavbarLayout>
    )
  }

  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  return (
    <NavbarLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search invoices or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-64"
              />
            </div>
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{formatAmount(totalAmount)}</p>
              <p className="text-sm text-gray-500 mt-1">{filteredInvoices.length} invoices</p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Paid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {filteredInvoices.filter(i => i.status === "paid").length} invoices
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Unpaid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{formatAmount(unpaidAmount)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {filteredInvoices.filter(i => i.status === "unpaid").length} invoices
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <Tabs defaultValue={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                <Switch 
                  id="show-deleted" 
                  checked={showDeleted}
                  onCheckedChange={setShowDeleted}
                />
                <label htmlFor="show-deleted" className="text-sm font-medium">
                  Show deleted invoices
                </label>
              </div>
            </div>
          </CardHeader>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice._id} 
                      className={`transition-colors hover:bg-gray-50 ${invoice.deleted ? "bg-gray-50" : ""}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{invoice.customerName}</div>
                        <div className="text-sm text-gray-500">{invoice.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatAmount(invoice.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={invoice.status === "paid" ? "success" : "destructive"}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{invoice.userName || "Unknown"}</div>
                        <div className="text-sm text-gray-500">{invoice.userEmail || "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!invoice.deleted ? (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => router.push(`/admin/invoices/${invoice._id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => 
                                  handleInvoiceAction(invoice._id, invoice.status === "paid" ? "markUnpaid" : "markPaid")
                                }>
                                  {invoice.status === "paid" ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2 text-yellow-500" />
                                      <span>Mark as Unpaid</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                      <span>Mark as Paid</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleInvoiceAction(invoice._id, "delete")}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Delete Invoice</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleInvoiceAction(invoice._id, "restore")}
                            className="text-blue-600"
                          >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </NavbarLayout>
  )
}