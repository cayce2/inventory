"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, ChevronRight} from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

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
    const interval = setInterval(fetchNotificationCount, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
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

      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )

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
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
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
        className="relative flex items-center justify-center h-10 w-10 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1 right-1 flex items-center justify-center h-5 min-w-5 text-xs font-medium text-white bg-red-500 rounded-full px-1.5"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  className="text-xs flex items-center text-blue-600 dark:text-blue-400 hover:underline gap-1"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full"
                  />
                </div>
              ) : notifications.length > 0 ? (
                <div>
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p
                              className={`text-sm font-medium truncate ${
                                !notification.read 
                                  ? "text-blue-600 dark:text-blue-400" 
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <span className="text-xs flex-shrink-0 text-gray-500 dark:text-gray-400">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2 text-center">
                    <Link
                      href="/notifications"
                      className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline gap-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>View all notifications</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                    <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We&apos;ll notify you when something arrives</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}