"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Notification {
  _id: string
  type: "subscription" | "lowStock" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedItemId?: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchNotificationCount()

    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchNotificationCount, 60000)

    // Clean up interval on unmount
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Add event listener to close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get("/api/notifications?countOnly=true", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUnreadCount(response.data.unread)
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get("/api/notifications?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setNotifications(response.data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
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

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
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
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
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

    setIsOpen(false)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? "s" : ""} ago`
    }
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-1 rounded-full hover:bg-gray-700 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-20">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1 text-xl">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p
                            className={`text-sm font-medium ${!notification.read ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
                          >
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 text-center">
                  <Link
                    href="/notifications"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => setIsOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

