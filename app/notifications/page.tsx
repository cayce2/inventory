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
  ArrowUpDown,
  Filter,
  Clock,
  X
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
  const [filterOpen, setFilterOpen] = useState(false)
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
      toast.success("Notifications refreshed", {
        icon: <RefreshCw className="h-4 w-4" />,
      })
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
      
      toast.success("Marked as read", {
        icon: <CheckCircle className="h-4 w-4" />,
      })
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
      toast.success("All notifications marked as read", {
        icon: <CheckCircle className="h-4 w-4" />,
      })
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
      toast.success("Notification deleted", {
        icon: <Trash2 className="h-4 w-4" />,
      })
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subscription":
        return "purple"
      case "lowStock":
        return "amber"
      default:
        return "blue"
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

  const notificationVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } }
  }

  const resetFilters = () => {
    setActiveTab("all")
    setShowUnreadOnly(false)
    setSortOrder("newest")
  }

  return (
    <NavbarLayout>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-gray-900">
          <header className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notifications.length} total, {unreadCount} unread
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 h-9"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="ml-1">Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-sm">
                    <SheetHeader>
                      <SheetTitle>Filter Notifications</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Notification Type</h3>
                        <RadioGroup 
                          value={activeTab}
                          onValueChange={setActiveTab}
                          className="grid grid-cols-2 gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="type-all" />
                            <Label htmlFor="type-all">All Types</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="subscription" id="type-subscription" />
                            <Label htmlFor="type-subscription">Subscription</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lowStock" id="type-lowStock" />
                            <Label htmlFor="type-lowStock">Low Stock</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="type-system" />
                            <Label htmlFor="type-system">System</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Status</h3>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="unread-filter-sheet" 
                            checked={showUnreadOnly} 
                            onCheckedChange={setShowUnreadOnly}
                          />
                          <Label htmlFor="unread-filter-sheet">Show unread only</Label>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Sort Order</h3>
                        <RadioGroup 
                          value={sortOrder}
                          onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="newest" id="sort-newest" />
                            <Label htmlFor="sort-newest">Newest first</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="oldest" id="sort-oldest" />
                            <Label htmlFor="sort-oldest">Oldest first</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <Button 
                          variant="outline" 
                          onClick={resetFilters} 
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reset
                        </Button>
                        <SheetClose asChild>
                          <Button>Apply Filters</Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchNotifications}
                  className="flex items-center gap-1 h-9"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="ml-1">Refresh</span>
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 h-9"
                  disabled={!notifications.some(n => !n.read)}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="ml-1">Mark All Read</span>
                </Button>
              </div>
            </div>
          </header>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-red-700 dark:text-red-400"
                onClick={() => setError("")}
              >
                Dismiss
              </Button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar for desktop */}
            <div className="hidden lg:block lg:col-span-3">
              <Card className="sticky top-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Notification Type</h3>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant={activeTab === "all" ? "default" : "ghost"} 
                        size="sm" 
                        className="justify-start"
                        onClick={() => setActiveTab("all")}
                      >
                        All Types
                      </Button>
                      <Button 
                        variant={activeTab === "subscription" ? "default" : "ghost"} 
                        size="sm" 
                        className="justify-start"
                        onClick={() => setActiveTab("subscription")}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 text-purple-500" />
                        Subscription
                      </Button>
                      <Button 
                        variant={activeTab === "lowStock" ? "default" : "ghost"} 
                        size="sm" 
                        className="justify-start"
                        onClick={() => setActiveTab("lowStock")}
                      >
                        <Package className="h-4 w-4 mr-2 text-amber-500" />
                        Low Stock
                      </Button>
                      <Button 
                        variant={activeTab === "system" ? "default" : "ghost"} 
                        size="sm" 
                        className="justify-start"
                        onClick={() => setActiveTab("system")}
                      >
                        <Settings className="h-4 w-4 mr-2 text-blue-500" />
                        System
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Status</h3>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="unread-filter" 
                        checked={showUnreadOnly} 
                        onCheckedChange={setShowUnreadOnly}
                      />
                      <Label htmlFor="unread-filter">Show unread only</Label>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Sort Order</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-between">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {sortOrder === "newest" ? "Newest first" : "Oldest first"}
                          </span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                          Newest first
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                          Oldest first
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={resetFilters}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-9">
                <CardHeader className="lg:hidden pb-3 space-y-4">
                  <CardTitle>Your Notifications</CardTitle>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4">
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
                  </Tabs>
                </CardHeader>
                
                <CardContent>
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
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-3">
                        <AnimatePresence>
                          {filteredNotifications.map((notification) => {
                            const typeColor = getTypeColor(notification.type);
                            return (
                              <motion.div
                                key={notification._id}
                                variants={notificationVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className={`
                                  p-4 rounded-lg cursor-pointer border
                                  ${!notification.read 
                                    ? `bg-${typeColor}-50 border-${typeColor}-200 dark:bg-${typeColor}-900/20 dark:border-${typeColor}-800` 
                                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}
                                  hover:shadow-md transition-all duration-200
                                `}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`p-2 rounded-full bg-${typeColor}-100 dark:bg-${typeColor}-900/30`}>
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                      <div>
                                        <div className="flex items-center">
                                          <h3 className={`font-medium truncate ${!notification.read ? `text-${typeColor}-700 dark:text-${typeColor}-400` : 'text-gray-900 dark:text-gray-100'}`}>
                                            {notification.title}
                                          </h3>
                                          {!notification.read && (
                                            <Badge variant="default" className={`ml-2 bg-${typeColor}-500 hover:bg-${typeColor}-600`}>
                                              New
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm my-2 line-clamp-2">
                                          {notification.message}
                                        </p>
                                        <div className="flex items-center flex-wrap gap-2 mt-1">
                                          <Badge variant="outline" className={`text-xs border-${typeColor}-200 dark:border-${typeColor}-800 text-${typeColor}-700 dark:text-${typeColor}-400`}>
                                            {getTypeLabel(notification.type)}
                                          </Badge>
                                          
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {getFormattedDate(notification.createdAt)}
                                          </span>
                                        </div>
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
                                            className={`h-8 w-8 text-${typeColor}-600 hover:text-${typeColor}-800 dark:text-${typeColor}-400 dark:hover:text-${typeColor}-300`}
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
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                      <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {activeTab === "all" 
                          ? <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          : activeTab === "subscription" 
                            ? <ShoppingCart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            : activeTab === "lowStock"
                              ? <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                              : <Settings className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        }
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">No notifications</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {activeTab !== "all" || showUnreadOnly
                          ? "Try changing your filters to see more notifications."
                          : "You don't have any notifications yet."}
                      </p>
                      {(activeTab !== "all" || showUnreadOnly) && (
                        <Button
                          variant="outline" 
                          size="sm"
                          className="mt-4"
                          onClick={resetFilters}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reset filters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </NavbarLayout>
  )
}