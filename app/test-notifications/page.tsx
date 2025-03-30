/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Bell, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

export default function TestNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [notificationType, setNotificationType] = useState<"subscription" | "lowStock" | "system">("system")
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const router = useRouter()

  const createTestNotification = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.post(
        "/api/test/notifications",
        {
          action: "create",
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setMessage(response.data.message)

      // Clear form
      setNotificationTitle("")
      setNotificationMessage("")
    } catch (error) {
      console.error("Error creating test notification:", error)
      setError("Failed to create test notification")
    } finally {
      setIsLoading(false)
    }
  }

  const runNotificationChecks = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.post(
        "/api/test/notifications",
        { action: "run-checks" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setMessage(response.data.message)
    } catch (error) {
      console.error("Error running notification checks:", error)
      setError("Failed to run notification checks")
    } finally {
      setIsLoading(false)
    }
  }

  const createTestSubscriptionData = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.post(
        "/api/test/notifications",
        { action: "test-subscription" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setMessage(
        `${response.data.message}. Subscription set to expire on ${new Date(response.data.subscriptionEndDate).toLocaleDateString()}`,
      )
    } catch (error) {
      console.error("Error creating test subscription data:", error)
      setError("Failed to create test subscription data")
    } finally {
      setIsLoading(false)
    }
  }

  const createTestLowStockData = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.post(
        "/api/test/notifications",
        { action: "test-low-stock" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setMessage(`${response.data.message}. Updated items: ${response.data.updatedItems.join(", ")}`)
    } catch (error) {
      console.error("Error creating test low stock data:", error)
      setError("Failed to create test low stock data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Bell className="mr-3 h-8 w-8 text-blue-600" />
            Test Notifications
          </h1>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This page is for testing purposes only. It allows you to create test notifications and trigger
                  notification checks manually.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Create Custom Notification</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="notificationType" className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Type
                  </label>
                  <select
                    id="notificationType"
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="lowStock">Low Stock</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notificationTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    id="notificationTitle"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification title"
                  />
                </div>
                <div>
                  <label htmlFor="notificationMessage" className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Message
                  </label>
                  <textarea
                    id="notificationMessage"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter notification message"
                  ></textarea>
                </div>
                <button
                  onClick={createTestNotification}
                  disabled={isLoading || !notificationTitle || !notificationMessage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Creating...
                    </span>
                  ) : (
                    "Create Test Notification"
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Run Notification Checks</h2>
              <p className="text-gray-600 mb-4">
                This will manually run the notification checks that would normally be executed by the cron job. It will
                check for subscription expirations and low stock items.
              </p>
              <button
                onClick={runNotificationChecks}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 mb-4"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Running...
                  </span>
                ) : (
                  "Run Notification Checks"
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Test Subscription Notifications</h2>
              <p className="text-gray-600 mb-4">
                This will set your subscription to expire in 5 days and run the notification checks to generate a
                subscription expiration notification.
              </p>
              <button
                onClick={createTestSubscriptionData}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </span>
                ) : (
                  "Test Subscription Notifications"
                )}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Test Low Stock Notifications</h2>
              <p className="text-gray-600 mb-4">
                This will set the quantity of up to 3 of your inventory items to low levels and run the notification
                checks to generate low stock notifications.
              </p>
              <button
                onClick={createTestLowStockData}
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </span>
                ) : (
                  "Test Low Stock Notifications"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}

