"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Bell, X, Check, Clock, AlertTriangle, CreditCard, Package } from "lucide-react"
import type { Notification } from "@/lib/types"

interface NotificationPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPopup({ isOpen, onClose }: NotificationPopupProps) {
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
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case "payment":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "inventory":
        return <Package className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={popupRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200"
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Notifications</h3>
        <div className="flex space-x-2">
          {notifications.some((n) => !n.isRead) && (
            <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : notifications.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li
                key={notification._id.toString()}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                      </p>
                      <div className="flex space-x-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id.toString())}
                            className="text-blue-600 hover:text-blue-800"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id.toString())}
                          className="text-red-600 hover:text-red-800"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

