/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
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
  RefreshCcw 
} from "lucide-react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"

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
  const [extensionDays, setExtensionDays] = useState("30")
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

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
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("An error occurred while fetching users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string, days?: string) => {
    try {
      setActionLoading(true)
      setError("")
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const payload: { targetUserId: string; action: string; days?: string } = {
        targetUserId: userId,
        action,
      }

      if (action === "extend" && days) {
        payload.days = days
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
    setIsExtendModalOpen(true)
  }

  const handleExtendSubscription = () => {
    handleUserAction(selectedUserId, "extend", extensionDays)
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => fetchUsers()}
                className="bg-white hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 shadow-sm flex items-center mr-2 transition-all inline-flex"
              >
                <RefreshCcw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 relative flex items-center" role="alert">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <span className="block">{error}</span>
              <button 
                className="absolute right-4 text-red-500 hover:text-red-700" 
                onClick={() => setError("")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Inactive Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.subscriptionStatus === "inactive").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deployment Progress</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Target: 100 users</div>
                <div className="text-sm font-medium text-indigo-600">{Math.round(calculateProgress())}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Current active users: {users.filter((user) => !user.suspended).length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">User Management</h2>
                
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={() => router.push("/admin/users/new")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Plus size={18} className="mr-2" />
                    Add User
                  </button>
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
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? "No users match your search" : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{user.email}</div>
                          <div className="text-gray-500 text-sm">{user.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{user.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              user.suspended ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {user.suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(user.subscriptionStatus)}`}
                            >
                            {user.subscriptionStatus || "inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">
                            {user.subscriptionEndDate 
                              ? new Date(user.subscriptionEndDate).toLocaleDateString() 
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/users/${user._id}`}>
                              <button className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors" title="View user details">
                                <Eye size={18} />
                              </button>
                            </Link>
                            <button
                              className="p-1 text-green-600 hover:text-green-900 transition-colors"
                              title="Extend subscription"
                              onClick={() => openExtendModal(user._id)}
                              disabled={actionLoading}
                            >
                              <Calendar size={18} />
                            </button>
                            <button
                              className={`p-1 ${
                                user.suspended 
                                  ? "text-green-600 hover:text-green-900" 
                                  : "text-red-600 hover:text-red-900"
                              } transition-colors`}
                              title={user.suspended ? "Unsuspend user" : "Suspend user"}
                              onClick={() => handleUserAction(user._id, user.suspended ? "unsuspend" : "suspend")}
                              disabled={actionLoading}
                            >
                              {user.suspended ? <Check size={18} /> : <Ban size={18} />}
                            </button>
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

      {/* Extend Subscription Modal */}
      <Transition appear show={isExtendModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsExtendModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black opacity-30" />
              </Transition.Child>
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Extend Subscription
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Select the number of days to extend this user&apos;s subscription
                  </p>
                </div>

                <div className="mt-4">
                  <select
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(e.target.value)}
                    className="w-full mt-1 block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">365 days</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    onClick={() => setIsExtendModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    onClick={handleExtendSubscription}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      "Extend"
                    )}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </NavbarLayout>
  )
}