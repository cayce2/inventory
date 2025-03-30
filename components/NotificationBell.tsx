"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCheck, ChevronRight, Loader2, X } from "lucide-react"
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
        return { emoji: "💰", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" }
      case "lowStock":
        return { emoji: "📦", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" }
      default:
        return { emoji: "🔔", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" }
    }
  }

  const bellVariants = {
    idle: { rotate: 0 },
    ringing: { 
      rotate: [0, 15, -15, 10, -10, 5, -5, 0],
      transition: { duration: 0.5 }
    }
  }

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        staggerChildren: 0.07
      }
    }
  }

  const notificationVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 40 }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={handleBellClick}
        className="relative p-2 rounded-full transition-all duration-200 bg-transparent hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        aria-label="Notifications"
        initial="idle"
        animate={unreadCount > 0 ? "ringing" : "idle"}
        variants={bellVariants}
        whileTap={{ scale: 0.9 }}
      >
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white transform translate-x-1/3 -translate-y-1/3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-0 mt-3 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-20 border border-gray-100 dark:border-gray-700"
            style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button 
                    onClick={markAllAsRead} 
                    className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </motion.button>
                )}
                
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-8 w-8 text-blue-500" />
                  </motion.div>
                </div>
              ) : notifications.length > 0 ? (
                <div>
                  {notifications.map((notification) => {
                    const { emoji, color } = getNotificationIcon(notification.type)
                    return (
                      <motion.div
                        key={notification._id}
                        variants={notificationVariants}
                        onClick={() => handleNotificationClick(notification)}
                        className={`group px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all ${
                          !notification.read ? "bg-blue-50/70 dark:bg-blue-900/20" : ""
                        }`}
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 mr-3 h-10 w-10 rounded-full ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <span className="text-xl">{emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  !notification.read 
                                    ? "text-blue-700 dark:text-blue-400" 
                                    : "text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {notification.title}
                                {!notification.read && (
                                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></span>
                                )}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                {getTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                              {notification.message}
                            </p>
                          </div>
                          <motion.div 
                            className="ml-2 mt-2 flex-shrink-0 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={{ x: -5, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )
                  })}
                  <motion.div 
                    className="p-3 text-center bg-gray-50 dark:bg-gray-750"
                    whileHover={{ backgroundColor: ["rgb(249, 250, 251)", "rgb(239, 246, 255)", "rgb(249, 250, 251)"] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Link
                      href="/notifications"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center justify-center gap-1 group transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 inline-flex"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>View all notifications</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </Link>
                  </motion.div>
                </div>
              ) : (
                <motion.div 
                  className="px-4 py-16 text-center text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.3 }}
                  >
                    <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                  <p className="text-base font-medium mb-1">No notifications yet</p>
                  <p className="text-sm mt-1 max-w-xs mx-auto">We&apos;ll notify you when something important happens in your account</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}