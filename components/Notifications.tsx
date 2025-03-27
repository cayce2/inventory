"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { 
  BellRing, 
  Check, 
  XIcon, 
  Clock, 
  CreditCard, 
  AlertOctagon, 
  PackageCheck, 
  ShieldAlert,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Notification } from "@/lib/types"

interface NotificationsProps {
  isOpen: boolean
  onClose: () => void
  className?: string;

}

export default function NotificationPopup({ isOpen, onClose }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get("/api/notifications", {
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
        "/api/notifications",
        { notificationId, isRead: true },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, isRead: true } : notification,
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

      setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await axios.delete("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        data: { notificationId },
      })

      setNotifications(notifications.filter((notification) => notification._id !== notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return <CreditCard className="h-6 w-6 text-indigo-500" />
      case "payment":
        return <AlertOctagon className="h-6 w-6 text-orange-500" />
      case "inventory":
        return <PackageCheck className="h-6 w-6 text-emerald-500" />
      case "security":
        return <ShieldAlert className="h-6 w-6 text-red-500" />
      default:
        return <BellRing className="h-6 w-6 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
          <BellRing className="mr-2 h-6 w-6 text-indigo-500" />
          Notifications
        </h3>
        <div className="flex space-x-2">
          {notifications.some((n) => !n.isRead) && (
            <button 
              onClick={markAllAsRead} 
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </button>
          )}
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ 
                repeat: Infinity, 
                duration: 1, 
                ease: "linear" 
              }}
              className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"
            />
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.li
                key={notification._id.toString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.isRead ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${!notification.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                        {notification.title}
                      </p>
                      <div className="flex space-x-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id.toString())}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id.toString())}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete notification"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center text-gray-500 dark:text-gray-400"
          >
            <BellRing className="h-10 w-10 mx-auto mb-2 text-indigo-400" />
            <p className="text-sm">No notifications yet</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}