/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import NavbarLayout from "@/components/NavbarLayout"
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Clock,
  ShoppingBag,
  FileText,
  UserCog,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  CreditCard,
  UserIcon,
  Mail,
  Phone,
  MoreHorizontal,
  Shield,
  Activity,
  ExternalLink,
  Search,
  Filter,
  Download,
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

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

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

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
  const [activeTab, setActiveTab] = useState("details")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const currency = 'KES'; 

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

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

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
      case "active":
        return "bg-emerald-100 text-emerald-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-amber-100 text-amber-800"
      case "paid":
        return "bg-emerald-100 text-emerald-800"
      case "unpaid":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500"
      case "inactive":
        return "bg-gray-500"
      case "expired":
        return "bg-red-500"
      case "cancelled":
        return "bg-amber-500"
      case "paid":
        return "bg-emerald-500"
      case "unpaid":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const filteredInvoices =
    stats?.recentInvoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === "all" || invoice.status === filterStatus
      return matchesSearch && matchesFilter
    }) || []

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 dark:bg-gray-900">
          <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
            <span className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading user details...</span>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error && !user) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 text-red-700 dark:text-red-300 p-4 rounded-md mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Admin Dashboard
          </Link>
        </div>
      </NavbarLayout>
    )
  }

  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Dashboard
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <span
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.suspended ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${user.suspended ? "bg-red-500 dark:bg-red-400" : "bg-emerald-500 dark:bg-emerald-400"}`}
                  ></span>
                  {user.suspended ? "Suspended" : "Active"}
                </span>

                {user.subscriptionStatus && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscriptionStatus)} dark:bg-opacity-50 dark:border dark:border-opacity-20`}
                  >
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${getStatusBgColor(user.subscriptionStatus)}`}></span>
                      {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                    </span>
                  </span>
                )}

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"}`}
                >
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
                  </span>
                </span>
              </div>
            )}
          </div>

          {user && (
            <div className="flex flex-col md:flex-row items-start mb-6">
              <div className="relative group">
                <div className="mr-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full h-16 w-16 flex items-center justify-center text-xl font-bold mb-2 md:mb-0 shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold dark:text-white flex items-center gap-2">
                  {user.name}
                  {user.role === "admin" && <Shield className="h-5 w-5 text-purple-500" />}
                </h1>
                <div className="mt-1 text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
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
                  <span className="inline-flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 text-red-700 dark:text-red-300 p-4 rounded-md mb-6 flex items-start"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-400 text-emerald-700 dark:text-emerald-300 p-4 rounded-md mb-6 flex items-start"
              >
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "details"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <UserCog className="h-4 w-4 mr-2" />
                User Details
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex items-center py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "stats"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Summary
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`flex items-center py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "invoices"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Invoices
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "activity"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Activity
              </button>
            </div>
          </div>

          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Details Form */}
              {activeTab === "details" && (
                <div className="md:col-span-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
                      <UserCog className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      User Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={user.name}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                            placeholder="Full name"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                            placeholder="Email address"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            name="phone"
                            value={user.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          User Role
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <select
                            name="role"
                            value={user.role}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none dark:text-white transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Subscription Status
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CreditCard className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <select
                            name="subscriptionStatus"
                            value={user.subscriptionStatus || ""}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none dark:text-white transition-colors"
                          >
                            <option value="">None</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Subscription End Date
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="date"
                            name="subscriptionEndDate"
                            value={user.subscriptionEndDate || ""}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Payment Due (formatAmount)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="number"
                            name="paymentDue"
                            value={user.paymentDue || ""}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="flex items-center py-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="suspended"
                            name="suspended"
                            checked={user.suspended}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                          <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Suspend User Account
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={fetchUserDetails}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 mr-3 transition-colors"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveUser}
                          disabled={isSaving}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                </div>
              )}

              {/* User Summary */}
              {activeTab === "stats" && (
                <div className="md:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">User Summary</h2>

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</h3>
                          <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</h3>
                          <div className="mt-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.suspended ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full mr-1.5 ${user.suspended ? "bg-red-500" : "bg-emerald-500"}`}
                              ></span>
                              {user.suspended ? "Suspended" : "Active"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription</h3>
                          <div className="mt-1.5">
                            {user.subscriptionStatus ? (
                              <>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.subscriptionStatus)}`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full mr-1.5 ${getStatusBgColor(user.subscriptionStatus)}`}
                                  ></span>
                                  {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                                </span>
                                {user.subscriptionEndDate && (
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Ends on {new Date(user.subscriptionEndDate).toLocaleDateString()}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">No active subscription</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Due</h3>
                          <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                            {user.paymentDue ? `$${user.paymentDue.toFixed(2)}` : formatAmount(0)}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">User Role</h3>
                          <div className="mt-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"}`}
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Invoice Summary
                      </h2>

                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoices</h3>
                          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                            {stats?.invoiceCount || 0}
                          </p>
                        </div>

                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Recent Invoices</h3>

                        {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                          <div className="space-y-3 mt-2">
                            {stats.recentInvoices.slice(0, 3).map((invoice) => (
                              <div
                                key={invoice._id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {invoice.invoiceNumber}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(invoice.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                                  >
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                  </span>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                   {formatAmount(invoice.amount)}
                                  </span>
                                  <Link
                                    href={`/admin/invoices/${invoice._id}`}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    View details
                                  </Link>
                                </div>
                              </div>
                            ))}

                            <Link
                              href="#"
                              onClick={() => setActiveTab("invoices")}
                              className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3"
                            >
                              View all invoices
                            </Link>
                          </div>
                        ) : (
                          <div className="text-center py-3 text-gray-500 dark:text-gray-400 text-sm">
                            No invoices found
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Inventory Summary
                      </h2>

                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Items in Inventory</h3>
                          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                            {stats?.inventoryCount || 0}
                          </p>
                        </div>

                        {/* Update the link to view user inventory to ensure it passes the userId correctly */}
                        <Link
                          href={`/admin/inventory?userId=${userId}`}
                          className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-5"
                          onClick={(e) => {
                            e.preventDefault()
                            console.log("Navigating to inventory with userId:", userId)
                            router.push(`/admin/inventory?userId=${userId}`)
                          }}
                        >
                          View user inventory
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices */}
              {activeTab === "invoices" && (
                <div className="md:col-span-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Customer Invoices
                      </h2>

                      <div className="mt-3 sm:mt-0 flex space-x-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                          >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {filteredInvoices.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Invoice #
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Customer
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Date
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Amount
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Status
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredInvoices.map((invoice) => (
                              <tr
                                key={invoice._id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {invoice.invoiceNumber}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">{invoice.customerName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(invoice.createdAt).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatAmount(invoice.amount)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                                  >
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end items-center space-x-2">
                                    <Link
                                      href={`/admin/invoices/${invoice._id}`}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      <span className="sr-only">View</span>
                                    </Link>
                                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                      <Download className="h-4 w-4" />
                                      <span className="sr-only">Download</span>
                                    </button>
                                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">More</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No invoices found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm || filterStatus !== "all"
                            ? "Try adjusting your search or filter to find what you're looking for."
                            : "Get started by creating a new invoice for this customer."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Log */}
              {activeTab === "activity" && (
                <div className="md:col-span-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Login Activity
                    </h2>

                    {stats?.loginHistory && stats.loginHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Date & Time
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                IP Address
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Browser / Device
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {stats.loginHistory.map((login) => (
                              <tr
                                key={login._id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {new Date(login.timestamp).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(login.timestamp).toLocaleTimeString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white font-mono">{login.ip}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-900 dark:text-white truncate max-w-md">
                                    {login.userAgent}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          No login activity found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          This user hasn&apos;t logged in recently.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}

