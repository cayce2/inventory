/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  Users, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  MoreVertical,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface User {
  _id: string
  name: string
  email: string
  role: string
  suspended: boolean
  paymentDue?: number
  subscriptionStatus?: "active" | "inactive" | "expired"
  subscriptionEndDate: string | null
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof User>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [extendDays, setExtendDays] = useState("30")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsRefreshing(true)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
      setIsLoading(false)
      setIsRefreshing(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("An error occurred while fetching users")
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleUserAction = async (userId: string, action: "suspend" | "unsuspend" | "extend" | "cancel") => {
    try {
      const token = localStorage.getItem("token")
      
      if (action === "extend") {
        await axios.put(
          "/api/admin/users",
          { targetUserId: userId, action, days: parseInt(extendDays) },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      } else {
        await axios.put(
          "/api/admin/users",
          { targetUserId: userId, action },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      }
      
      fetchUsers()
    } catch (error) {
      console.error(`Error performing action on user:`, error)
      setError(`An error occurred while performing the action`)
    }
  }

  const handleSubscriptionExtend = (user: User) => {
    setSelectedUser(user)
    setIsExtendDialogOpen(true)
  }

  const confirmExtend = () => {
    if (selectedUser) {
      handleUserAction(selectedUser._id, "extend")
      setIsExtendDialogOpen(false)
    }
  }

  const calculateProgress = () => {
    const activeUsers = users.filter((user) => !user.suspended).length
    return (activeUsers / 100) * 100
  }

  const sortUsers = (a: User, b: User) => {
    // Handle string and boolean fields
    if (sortField === "name" || sortField === "email" || sortField === "role") {
      return sortDirection === "asc" 
        ? String(a[sortField]).localeCompare(String(b[sortField]))
        : String(b[sortField]).localeCompare(String(a[sortField]))
    }
    
    // Handle boolean fields (suspended)
    if (sortField === "suspended") {
      return sortDirection === "asc"
        ? Number(a[sortField]) - Number(b[sortField])
        : Number(b[sortField]) - Number(a[sortField])
    }

    // Default sort by name
    return sortDirection === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  }

  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredUsers = users
  .filter((user) => 
    (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (user.role?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )
  .sort(sortUsers)
  
  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <Skeleton className="h-48 w-full mb-8 rounded-lg" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="rounded-full bg-red-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchUsers} variant="default">
              Try Again
            </Button>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage users and subscriptions</p>
            </div>
            <Button 
              onClick={fetchUsers} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => !u.suspended).length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Suspended Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => u.suspended).length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Deployment Progress
              </CardTitle>
              <CardDescription>Target: 100 active users</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={calculateProgress()} className="h-2" />
              <div className="mt-4 text-sm text-gray-500 flex justify-between">
                <span>0</span>
                <span>Current: {users.filter((user) => !user.suspended).length}</span>
                <span>100</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === "name" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-1">
                          Email
                          {sortField === "email" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("role")}
                      >
                        <div className="flex items-center gap-1">
                          Role
                          {sortField === "role" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("suspended")}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortField === "suspended" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                          No users match your search criteria
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={user.role === "admin" ? "destructive" : "outline"}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={user.suspended ? "destructive" : "success"}>
                              {user.suspended ? "Suspended" : "Active"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge 
                              variant={
                                user.subscriptionStatus === "active"
                                  ? "success"
                                  : user.subscriptionStatus === "expired"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {user.subscriptionStatus
                                ? user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)
                                : "N/A"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, user.suspended ? "unsuspend" : "suspend")}
                                  className={user.suspended ? "text-green-600" : "text-red-600"}
                                >
                                  {user.suspended ? "Unsuspend User" : "Suspend User"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSubscriptionExtend(user)}
                                >
                                  Extend Subscription
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, "cancel")}
                                  className="text-yellow-600"
                                >
                                  Cancel Subscription
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>Extend the subscription for {selectedUser.name}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
              Number of days to extend
            </Label>
            <Input
              id="days"
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              min="1"
              className="mt-1 block w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmExtend}>
              Extend Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NavbarLayout>
  )
}