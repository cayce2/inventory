/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Users, Shield, Activity, AlertCircle, Check, X, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface User {
  _id: string
  name: string
  email: string
  role: string
  suspended: boolean
}

interface DashboardStats {
  activeUsers: number
  suspendedUsers: number
  totalUsers: number
  targetUsers: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers: 0,
    suspendedUsers: 0,
    totalUsers: 0,
    targetUsers: 100
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (users.length > 0) {
      const activeCount = users.filter(user => !user.suspended).length
      setStats({
        activeUsers: activeCount,
        suspendedUsers: users.length - activeCount,
        totalUsers: users.length,
        targetUsers: 100
      })
    }
  }, [users])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/admin", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("An error occurred while fetching users")
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUserAction = async (userId: string, action: "suspend" | "unsuspend") => {
    setIsActionLoading(userId)
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        "/api/admin",
        { targetUserId: userId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      fetchUsers()
      toast({
        title: "Success",
        description: `User ${action === "suspend" ? "suspended" : "unsuspended"} successfully`,
        variant: "default"
      })
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      setError(`An error occurred while ${action}ing the user`)
      toast({
        title: "Action Failed",
        description: `Could not ${action} user. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  const calculateProgress = () => {
    return (stats.activeUsers / stats.targetUsers) * 100
  }

  // Format role with capitalization and handle undefined
  const formatRole = (role?: string) => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-4" />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchUsers} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-sm text-gray-500">All registered users in the system</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
              <p className="text-sm text-gray-500">Currently active accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Suspended Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.suspendedUsers}</div>
              <p className="text-sm text-gray-500">Accounts currently suspended</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Tracker */}
        <Card className="mb-8">
          <CardHeader className="pb-0">
            <CardTitle>Deployment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Target: {stats.targetUsers} users</span>
                <span className="text-sm font-medium">{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Current active users: {stats.activeUsers}</span>
              <span>Remaining: {stats.targetUsers - stats.activeUsers}</span>
            </div>
          </CardContent>
        </Card>

        {/* User Management Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>User Management</span>
              <Button variant="outline" size="sm" onClick={fetchUsers} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.name || "Unknown"}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.email || "No email"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>
                            {formatRole(user.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={user.suspended ? "destructive" : "success"} className="flex items-center gap-1 w-fit">
                            {user.suspended ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {user.suspended ? "Suspended" : "Active"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isActionLoading === user._id ? (
                            <Button disabled size="sm" variant="outline" className="flex items-center gap-2">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Processing...
                            </Button>
                          ) : user.suspended ? (
                            <Button 
                              onClick={() => handleUserAction(user._id, "unsuspend")}
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              Activate Account
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleUserAction(user._id, "suspend")}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Suspend Account
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </NavbarLayout>
  )
}