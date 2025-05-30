/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, Fragment, useCallback } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import Link from "next/link"
import { 
  Eye, 
  AlertCircle, 
  X, 
  Calendar, 
  Check, 
  Ban, 
  Clock, 
  UserCheck, 
  Search, 
  Plus, 
  RefreshCcw,
  Users,
  Mail,
  ChevronDown,
  MoreHorizontal,
  ArrowUpRight,
  Filter
} from "lucide-react"
import { Dialog, Transition, Menu } from "@headlessui/react"

interface User {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  suspended: boolean
  paymentDue?: number
  subscriptionStatus?: "active" | "inactive" | "expired"
  subscriptionEndDate: string | null
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [extensionDate, setExtensionDate] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [tableView, setTableView] = useState("all")
  const router = useRouter()

  // Fetch users on mount only
  useEffect(() => {
    fetchUsers()
  }, [])

  // Set default extension date once on mount
  useEffect(() => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    setExtensionDate(formatDateForInput(thirtyDaysFromNow))
  }, [])

  // Memoize the filterUsers function with useCallback
  const filterUsers = useCallback(() => {
    let filtered = users

    // First apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Then apply table view filter
    if (tableView === "active") {
      filtered = filtered.filter(user => !user.suspended)
    } else if (tableView === "suspended") {
      filtered = filtered.filter(user => user.suspended)
    } else if (tableView === "subscription-active") {
      filtered = filtered.filter(user => user.subscriptionStatus === "active")
    } else if (tableView === "subscription-inactive") {
      filtered = filtered.filter(user => user.subscriptionStatus === "inactive" || user.subscriptionStatus === "expired")
    }

    return filtered
  }, [searchTerm, tableView, users])

  // Apply the filtering effect with proper dependencies
  useEffect(() => {
    setFilteredUsers(filterUsers())
  }, [filterUsers])

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
      // Don't set filteredUsers here, it will be set by the useEffect
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("An error occurred while fetching users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string, extensionDate?: string) => {
    try {
      setActionLoading(true)
      setError("")
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const payload: { targetUserId: string; action: string; extensionDate?: string } = {
        targetUserId: userId,
        action,
      }

      if (action === "extend" && extensionDate) {
        payload.extensionDate = extensionDate
      }

      await axios.put("/api/admin/users", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      fetchUsers()
    } catch (error) {
      console.error(`Error performing action on user:`, error)
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || `Failed to ${action} user`}`)
      } else {
        setError(`An unexpected error occurred while updating the user`)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const openExtendModal = (userId: string) => {
    setSelectedUserId(userId)
    
    // Find the user's current subscription end date if available
    const user = users.find(u => u._id === userId)
    if (user && user.subscriptionEndDate) {
      // Set date to 30 days after current end date
      const currentEndDate = new Date(user.subscriptionEndDate)
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(currentEndDate.getDate() + 30)
      setExtensionDate(formatDateForInput(newEndDate))
    } else {
      // Default to 30 days from now
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      setExtensionDate(formatDateForInput(thirtyDaysFromNow))
    }
    
    setIsExtendModalOpen(true)
  }

  const handleExtendSubscription = () => {
    handleUserAction(selectedUserId, "extend", extensionDate)
    setIsExtendModalOpen(false)
  }

  const calculateProgress = () => {
    const activeUsers = users.filter((user) => !user.suspended).length
    return (activeUsers / 100) * 100
  }

  const getStatusBadgeClass = (status?: string) => {
    if (status === "active") return "bg-emerald-100 text-emerald-800"
    if (status === "expired") return "bg-red-100 text-red-800"
    return "bg-amber-100 text-amber-800"
  }

  const getUser = (userId: string) => {
    return users.find(u => u._id === userId)
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage users and subscriptions</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => fetchUsers()}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-200 shadow-sm flex items-center transition-all"
              >
                <RefreshCcw size={16} className="mr-2" />
                Refresh
              </button>
              
              <button
                onClick={() => router.push("/admin/users/new")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 relative flex items-center animate-fadeIn" role="alert">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <span className="block">{error}</span>
              <button 
                className="absolute right-4 text-red-500 hover:text-red-700" 
                onClick={() => setError("")}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all cursor-pointer ${tableView === 'active' ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
              onClick={() => setTableView(tableView === 'active' ? 'all' : 'active')}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => !u.suspended).length}</p>
                </div>
              </div>
            </div>
            
            <div 
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all cursor-pointer ${tableView === 'subscription-active' ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
              onClick={() => setTableView(tableView === 'subscription-active' ? 'all' : 'subscription-active')}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
                  <Check size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.subscriptionStatus === "active").length}</p>
                </div>
              </div>
            </div>
            
            <div 
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all cursor-pointer ${tableView === 'subscription-inactive' ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
              onClick={() => setTableView(tableView === 'subscription-inactive' ? 'all' : 'subscription-inactive')}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Inactive Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.subscriptionStatus === "inactive" || u.subscriptionStatus === "expired").length}</p>
                </div>
              </div>
            </div>
            
            <div 
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all cursor-pointer ${tableView === 'suspended' ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
              onClick={() => setTableView(tableView === 'suspended' ? 'all' : 'suspended')}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                  <Ban size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Suspended Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.suspended).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Deployment Progress</h2>
              <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {Math.round(calculateProgress())}% Complete
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Target: 100 users</div>
                <div className="text-sm font-medium text-indigo-600">{users.filter((user) => !user.suspended).length} Users</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <UserCheck size={14} className="mr-1 text-indigo-500" />
                  {users.filter((user) => !user.suspended).length} Active
                </span>
                <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Ban size={14} className="mr-1 text-red-500" />
                  {users.filter((user) => user.suspended).length} Suspended
                </span>
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {tableView === 'all' && 'Showing all users'}
                    {tableView === 'active' && 'Showing active users'}
                    {tableView === 'suspended' && 'Showing suspended users'}
                    {tableView === 'subscription-active' && 'Showing users with active subscriptions'}
                    {tableView === 'subscription-inactive' && 'Showing users with inactive subscriptions'}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 mt-4 md:mt-0">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 shadow-sm flex items-center justify-center transition-colors">
                      <Filter size={16} className="mr-2" />
                      <span>Filters</span>
                      <ChevronDown size={16} className="ml-2" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setTableView('all')}
                                className={`${
                                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                <Users size={16} className="mr-2" />
                                All Users
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setTableView('active')}
                                className={`${
                                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                <UserCheck size={16} className="mr-2" />
                                Active Users
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setTableView('suspended')}
                                className={`${
                                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                <Ban size={16} className="mr-2" />
                                Suspended Users
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setTableView('subscription-active')}
                                className={`${
                                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                <Check size={16} className="mr-2" />
                                Active Subscriptions
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setTableView('subscription-inactive')}
                                className={`${
                                  active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                <Clock size={16} className="mr-2" />
                                Inactive Subscriptions
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center bg-gray-50 py-8 px-4 rounded-lg">
                          <Search size={40} className="text-gray-300 mb-4" />
                          <p className="text-gray-700 font-medium text-lg mb-2">
                            {searchTerm ? "No users match your search" : "No users found for the selected filter"}
                          </p>
                          <p className="text-gray-500 mb-4 max-w-md text-center">
                            {searchTerm 
                              ? "Try adjusting your search term or clearing filters to see more results." 
                              : "Try selecting a different filter option to view other users."}
                          </p>
                          <button 
                            className="mt-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                            onClick={() => {
                              setSearchTerm("")
                              setTableView("all")
                            }}
                          >
                            <RefreshCcw size={14} className="mr-1" />
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail size={14} className="text-gray-400 mr-2" />
                            <div>
                              <div className="text-gray-900">{user.email}</div>
                              <div className="text-gray-500 text-sm">{user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                              user.suspended 
                                ? "bg-red-100 text-red-800" 
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {user.suspended 
                              ? <><Ban size={12} className="mr-1" /> Suspended</> 
                              : <><Check size={12} className="mr-1" /> Active</>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center ${getStatusBadgeClass(user.subscriptionStatus)}`}
                          >
                            {user.subscriptionStatus === "active" && <Check size={12} className="mr-1" />}
                            {user.subscriptionStatus === "inactive" && <Clock size={12} className="mr-1" />}
                            {user.subscriptionStatus === "expired" && <X size={12} className="mr-1" />}
                            {user.subscriptionStatus || "inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 flex items-center">
                            <Calendar size={14} className="text-gray-400 mr-2" />
                            {user.subscriptionEndDate 
                              ? new Date(user.subscriptionEndDate).toLocaleDateString() 
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/admin/users/${user._id}`}
                              className="text-gray-500 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                            >
                              <Eye size={18} />
                            </Link>
                            
                            <button
                              className="text-gray-500 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                              onClick={() => openExtendModal(user._id)}
                              disabled={actionLoading}
                            >
                              <Calendar size={18} />
                            </button>
                            
                            <Menu as="div" className="relative inline-block text-left">
                              <div>
                                <Menu.Button className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                                  <MoreHorizontal size={18} />
                                </Menu.Button>
                              </div>
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link 
                                          href={`/admin/users/${user._id}`}
                                          className={`${
                                            active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                          } flex px-4 py-2 text-sm items-center justify-between`}
                                        >
                                          <span className="flex items-center">
                                            <Eye size={16} className="mr-2" />
                                            View Details
                                          </span>
                                          <ArrowUpRight size={14} />
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                          } flex px-4 py-2 text-sm w-full items-center`}
                                          onClick={() => openExtendModal(user._id)}
                                          disabled={actionLoading}
                                        >
                                          <Calendar size={16} className="mr-2" />
                                          Extend Subscription
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                        className={`${
                                          active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                        } flex px-4 py-2 text-sm w-full items-center`}
                                        onClick={() => handleUserAction(user._id, user.suspended ? "unsuspend" : "suspend")}
                                        disabled={actionLoading}
                                      >
                                        <Ban size={16} className="mr-2" />
                                        {user.suspended ? "Unsuspend User" : "Suspend User"}
                                      </button>
                                      )}
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </Menu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
  
        {/* Extension Modal */}
        <Transition appear show={isExtendModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsExtendModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>
  
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Extend Subscription
                    </Dialog.Title>
                    
                    {selectedUserId && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-4">
                          Extending subscription for <span className="font-medium text-gray-700">{getUser(selectedUserId)?.name}</span>
                        </p>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New End Date
                          </label>
                          <input
                            type="date"
                            value={extensionDate}
                            onChange={(e) => setExtensionDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            min={formatDateForInput(new Date())}
                          />
                        </div>
                      </div>
                    )}
  
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => setIsExtendModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={handleExtendSubscription}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          "Confirm Extension"
                        )}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </NavbarLayout>
    );
  }