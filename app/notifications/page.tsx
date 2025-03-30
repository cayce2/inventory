/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  ShoppingCart, 
  Package, 
  Settings,
  AlertCircle,
  ArrowUpDown
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Notification {
  _id: string
  type: "subscription" | "lowStock" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedItemId?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get("/api/notifications?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setNotifications(response.data)
      toast.success("Notifications refreshed")
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("An error occurred while fetching notifications")
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await axios.put(
        `/api/notifications/${notificationId}`,
        { read: true },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
      
      toast.success("Marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await axios.put(
        "/api/notifications/mark-all-read",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update local state
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await axios.delete(`/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local state
      setNotifications(notifications.filter((notification) => notification._id !== notificationId))
      toast.success("Notification deleted")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id)
    }

    // Navigate based on notification type
    if (notification.type === "subscription") {
      router.push("/subscription")
    } else if (notification.type === "lowStock" && notification.relatedItemId) {
      router.push(`/inventory/${notification.relatedItemId}`)
    }
  }

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    } else {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return <ShoppingCart className="h-5 w-5 text-purple-500" />
      case "lowStock":
        return <Package className="h-5 w-5 text-amber-500" />
      default:
        return <Settings className="h-5 w-5 text-blue-500" />
    }
  }

  const filteredNotifications = notifications
    .filter((notification) => {
      // Filter by type
      if (activeTab !== "all" && notification.type !== activeTab) {
        return false
      }

      // Filter by read status
      if (showUnreadOnly && notification.read) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

  const unreadCount = notifications.filter(n => !n.read).length
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "subscription": return "Subscription"
      case "lowStock": return "Low Stock"
      case "system": return "System"
      default: return "Unknown"
    }
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 dark:bg-gray-900">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative mr-3">
                <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchNotifications}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Refresh</span>
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-1"
                disabled={!notifications.some(n => !n.read)}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Mark All Read</span>
              </Button>
            </div>
          </div>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <CardTitle>Your Notifications</CardTitle>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="unread-filter" 
                    checked={showUnreadOnly} 
                    onCheckedChange={setShowUnreadOnly}
                  />
                  <Label htmlFor="unread-filter">Unread only</Label>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span>{sortOrder === "newest" ? "Newest first" : "Oldest first"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                      Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                      Oldest first
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  All
                </TabsTrigger>
                <TabsTrigger value="subscription">
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="lowStock">
                  Low Stock
                </TabsTrigger>
                <TabsTrigger value="system">
                  System
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <Skeleton className="h-10 w-10 rounded-full mr-4" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`
                            p-4 rounded-lg cursor-pointer border 
                            ${!notification.read 
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                              : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}
                            hover:shadow-md transition-all duration-200
                          `}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${
                              notification.type === 'subscription' ? 'bg-purple-100 dark:bg-purple-900/30' :
                              notification.type === 'lowStock' ? 'bg-amber-100 dark:bg-amber-900/30' :
                              'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                <div>
                                  <h3 className={`font-medium truncate mb-1 ${!notification.read ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {notification.title}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 md:gap-4 md:ml-4 mt-2 md:mt-0">
                                  <Badge variant="outline" className="text-xs">
                                    {getTypeLabel(notification.type)}
                                  </Badge>
                                  
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {getFormattedDate(notification.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                      onClick={(e) => markAsRead(notification._id, e)}
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Mark as read</TooltipContent>
                                </Tooltip>
                              )}
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    onClick={(e) => deleteNotification(notification._id, e)}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-gray-200">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {activeTab !== "all" || showUnreadOnly
                        ? "Try changing your filters to see more notifications."
                        : "You don't have any notifications yet."}
                    </p>
                    {activeTab !== "all" || showUnreadOnly ? (
                      <Button
                        variant="outline" 
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setActiveTab("all");
                          setShowUnreadOnly(false);
                        }}
                      >
                        Reset filters
                      </Button>
                    ) : null}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </NavbarLayout>
  )
}