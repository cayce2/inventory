/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Bell, CheckCircle, Trash2, Filter, RefreshCw } from "lucide-react"

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
  const [filterType, setFilterType] = useState("all")
  const [filterRead, setFilterRead] = useState("all")
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
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("An error occurred while fetching notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
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
    } catch (error) {
      console.error("Error marking notification as read:", error)
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
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await axios.delete(`/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local state
      setNotifications(notifications.filter((notification) => notification._id !== notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
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
      router.push("/inventory")
    }
  }

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return "💰"
      case "lowStock":
        return "📦"
      default:
        return "🔔"
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    // Filter by type
    if (filterType !== "all" && notification.type !== filterType) {
      return false
    }

    // Filter by read status
    if (filterRead === "read" && !notification.read) {
      return false
    }
    if (filterRead === "unread" && notification.read) {
      return false
    }

    return true
  })

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <Bell className="mr-3 h-8 w-8 text-blue-600" />
          Notifications
        </h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="mr-4">
                <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="subscription">Subscription</option>
                    <option value="lowStock">Low Stock</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="filterRead" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="filterRead"
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={fetchNotifications}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>

              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All as Read
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Message
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNotifications.map((notification) => (
                      <tr
                        key={notification._id}
                        className={`hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium ${!notification.read ? "text-blue-600" : "text-gray-900"} cursor-pointer`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            {notification.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-md truncate">{notification.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{getFormattedDate(notification.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              notification.read ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {notification.read ? "Read" : "Unread"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterType !== "all" || filterRead !== "all"
                  ? "Try changing your filters to see more notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}

