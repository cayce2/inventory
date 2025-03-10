"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Bell, Search, Filter, Users, Clock } from "lucide-react"

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
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [extendDays, setExtendDays] = useState("30")
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (users.length) {
      applyFilters()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, filterStatus])


  const applyFilters = () => {
    let result = [...users]
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        (user.phone && user.phone.toLowerCase().includes(term))
      )
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        result = result.filter(user => !user.suspended && user.subscriptionStatus === "active")
      } else if (filterStatus === "suspended") {
        result = result.filter(user => user.suspended)
      } else if (filterStatus === "expired") {
        result = result.filter(user => user.subscriptionStatus === "expired")
      } else if (filterStatus === "inactive") {
        result = result.filter(user => user.subscriptionStatus === "inactive")
      }
    }
    
    setFilteredUsers(result)
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
      setFilteredUsers(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("An error occurred while fetching users")
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: "suspend" | "unsuspend" | "extend" | "cancel") => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        "/api/admin/users",
        { 
          targetUserId: userId, 
          action,
          ...(action === "extend" && { days: parseInt(extendDays) })
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      
      // Close dialog after action
      setShowActionDialog(false)
      setSelectedUser(null)
      
      // Refresh user data
      fetchUsers()
    } catch (error) {
      console.error(`Error performing action on user:`, error)
      setError(`An error occurred while performing the action`)
    }
  }
  
  const openActionDialog = (user: User) => {
    setSelectedUser(user)
    setShowActionDialog(true)
  }

  const calculateProgress = () => {
    const activeUsers = users.filter((user) => !user.suspended && user.subscriptionStatus === "active").length
    return (activeUsers / 100) * 100
  }

  const getStatusColor = (status: string | undefined, suspended: boolean) => {
    if (suspended) return "bg-red-100 text-red-800"
    
    switch(status) {
      case "active": return "bg-green-100 text-green-800"
      case "inactive": return "bg-yellow-100 text-yellow-800"
      case "expired": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="min-h-screen p-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button 
              onClick={() => fetchUsers()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Bell size={20} />
              </button>
              <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                A
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Active Users</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {users.filter(u => !u.suspended && u.subscriptionStatus === "active").length}
                  </h2>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-1">Target: 100 users</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Suspended Users</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {users.filter(u => u.suspended).length}
                  </h2>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <Users size={20} className="text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {users.filter(u => u.suspended).length > 0 
                    ? `${((users.filter(u => u.suspended).length / users.length) * 100).toFixed(1)}% of total users` 
                    : "No suspended users"}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Expiring Soon</p>
                  <h2 className="text-3xl font-bold mt-1">
                    {users.filter(u => {
                      if (!u.subscriptionEndDate) return false;
                      const endDate = new Date(u.subscriptionEndDate);
                      const today = new Date();
                      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                      return diffDays <= 7 && diffDays > 0;
                    }).length}
                  </h2>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500">Subscriptions expiring in 7 days</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
              <div className="relative flex-1 max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, email or phone..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <div className="relative">
                  <select
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${user.suspended ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                            {user.suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`px-2 py-1 text-xs rounded-full inline-block w-fit ${getStatusColor(user.subscriptionStatus, false)}`}>
                              {user.subscriptionStatus
                                ? user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)
                                : "N/A"}
                            </span>
                            <span className="text-sm text-gray-500 mt-1">
                              {user.subscriptionEndDate 
                                ? new Date(user.subscriptionEndDate).toLocaleDateString() 
                                : "No end date"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => openActionDialog(user)}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No users found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                {/* Pagination could be added here */}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Dialog */}
      {showActionDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Manage User</h3>
                <button 
                  onClick={() => {
                    setShowActionDialog(false)
                    setSelectedUser(null)
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-gray-500">Status</div>
                    <div className={`font-medium ${selectedUser.suspended ? "text-red-600" : "text-green-600"}`}>
                      {selectedUser.suspended ? "Suspended" : "Active"}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-gray-500">Subscription</div>
                    <div className="font-medium">
                      {selectedUser.subscriptionStatus
                        ? selectedUser.subscriptionStatus.charAt(0).toUpperCase() + selectedUser.subscriptionStatus.slice(1)
                        : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-gray-500">Role</div>
                    <div className="font-medium">{selectedUser.role}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-gray-500">End Date</div>
                    <div className="font-medium">
                      {selectedUser.subscriptionEndDate 
                        ? new Date(selectedUser.subscriptionEndDate).toLocaleDateString() 
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Suspend/Unsuspend Button */}
                <button
                  onClick={() => handleUserAction(selectedUser._id, selectedUser.suspended ? "unsuspend" : "suspend")}
                  className={`w-full py-2 px-4 rounded text-white ${
                    selectedUser.suspended
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {selectedUser.suspended ? "Unsuspend User" : "Suspend User"}
                </button>
                
                {/* Extend Subscription */}
                {!selectedUser.suspended && (
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="number"
                        min="1"
                        value={extendDays}
                        onChange={(e) => setExtendDays(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">days</span>
                    </div>
                    <button
                      onClick={() => handleUserAction(selectedUser._id, "extend")}
                      className="w-full py-2 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Extend Subscription
                    </button>
                  </div>
                )}
                
                {/* Cancel Subscription */}
                <button
                  onClick={() => handleUserAction(selectedUser._id, "cancel")}
                  className="w-full py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NavbarLayout>
  )
}