/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  ArrowLeft, Save, RefreshCw, Clock, ShoppingBag, FileText, 
  UserCog, Calendar, DollarSign, AlertCircle, CheckCircle, 
  CreditCard, Lock, User as UserIcon, Mail, Phone
} from "lucide-react"
import Link from "next/link"

interface User {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  suspended: boolean
  subscriptionStatus?: "active" | "inactive" | "expired" | "cancelled"
  subscriptionEndDate?: string
  paymentDue?: number
  createdAt: string
}

interface LoginHistory {
  _id: string
  userId: string
  timestamp: string
  ip: string
  userAgent: string
}

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  amount: number
  status: "paid" | "unpaid"
  createdAt: string
}

interface UserStats {
  invoiceCount: number
  recentInvoices: Invoice[]
  inventoryCount: number
  loginHistory: LoginHistory[]
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  // Tab state for mobile view
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUser(response.data.user)
      setStats(response.data.stats)
    } catch (error) {
      console.error("Error fetching user details:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to fetch user details"}`)
      } else {
        setError("An unexpected error occurred while fetching user details")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (!user) return

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setUser({ ...user, [name]: checked })
    } else if (name === "subscriptionEndDate") {
      setUser({ ...user, [name]: value })
    } else if (name === "paymentDue") {
      setUser({ ...user, [name]: Number.parseFloat(value) })
    } else {
      setUser({ ...user, [name]: value })
    }
  }

  const handleSaveUser = async () => {
    try {
      setIsSaving(true)
      setError("")
      setSuccessMessage("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      await axios.put(`/api/admin/users/${userId}`, user, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSuccessMessage("User updated successfully")
      fetchUserDetails() // Refresh data
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error updating user:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to update user"}`)
      } else {
        setError("An unexpected error occurred while updating the user")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-amber-100 text-amber-800'
      case 'paid':
        return 'bg-emerald-100 text-emerald-800'
      case 'unpaid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
            <span className="mt-4 text-gray-600 font-medium">Loading user details...</span>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error && !user) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft className="mr-2" size={16} />
            Back to Admin Dashboard
          </Link>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft className="mr-2" size={16} />
            Back to Dashboard
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.suspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {user.suspended ? 'Suspended' : 'Active'}
              </span>
              
              {user.subscriptionStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscriptionStatus)}`}>
                  {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                </span>
              )}
              
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
              </span>
            </div>
          )}
        </div>

        {user && (
          <div className="flex flex-col md:flex-row items-start mb-6">
            <div className="mr-4 bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-2 md:mb-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              <div className="mt-1 text-gray-500 flex flex-wrap gap-3">
                <span className="inline-flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-1" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-1" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border-l-4 border-emerald-400 text-emerald-700 p-4 rounded-md mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mobile tabs */}
        <div className="md:hidden flex border-b mb-6">
          <button 
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3 text-center font-medium ${activeTab === "details" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            User Details
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3 text-center font-medium ${activeTab === "stats" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            Summary
          </button>
          <button 
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 py-3 text-center font-medium ${activeTab === "invoices" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            Invoices
          </button>
        </div>

        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Details Form - show on mobile only when details tab is active */}
            <div className={`md:col-span-2 ${activeTab !== "details" && "hidden md:block"}`}>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <UserCog className="h-5 w-5 mr-2 text-blue-600" />
                  User Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="phone"
                        value={user.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">User Role</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        name="role"
                        value={user.role}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription Status</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        name="subscriptionStatus"
                        value={user.subscriptionStatus || ""}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">None</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription End Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="subscriptionEndDate"
                        value={user.subscriptionEndDate || ""}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Due ($)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="paymentDue"
                        value={user.paymentDue || ""}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="suspended"
                      name="suspended"
                      checked={user.suspended}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="suspended" className="ml-2 block text-sm font-medium text-gray-700">
                      Suspend User Account
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5 mt-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={fetchUserDetails}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 mr-3"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUser}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Login Activity
                </h2>

                {stats && stats.loginHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Device
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.loginHistory.map((login) => (
                          <tr key={login._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(login.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {login.ip}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {login.userAgent.split(")")[0].split("(")[1]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <p>No login history available</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Summary - show on mobile only when stats tab is active */}
            <div className={`${activeTab !== "stats" && "hidden md:block"}`}>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">User Summary</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                    <p className="mt-1 text-lg font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.suspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {user.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                  
                  {user.subscriptionStatus && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Subscription</h3>
                      <div className="mt-1.5 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.subscriptionStatus)}`}>
                          {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                        </span>
                        {user.subscriptionEndDate && (
                          <span className="ml-2 text-sm text-gray-600">
                            Expires: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {stats && (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Invoices</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {stats.invoiceCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-gray-500">Inventory Items</h3>
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {stats.inventoryCount}
                          </span>
                        </div>
                      </div>
                      
                      {user.paymentDue && user.paymentDue > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-500">Payment Due</h3>
                          <p className="mt-1 text-lg font-bold text-red-600">
                            ${user.paymentDue.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Invoices - show on mobile only when invoices tab is active */}
            <div className={`md:col-span-3 ${activeTab !== "invoices" && "hidden md:block"}`}>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Invoices
                </h2>

                {stats && stats.recentInvoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.recentInvoices.map((invoice) => (
                          <tr key={invoice._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                              <Link href={`/invoices/${invoice._id}`}>
                                {invoice.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${invoice.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                    <p>No invoices available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </NavbarLayout>
  )
}