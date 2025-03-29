"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { RefreshCw, CheckCircle, AlertCircle, Clock, Mail, Calendar } from 'lucide-react'

export default function SubscriptionReminders() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; remindersSent: number } | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const triggerReminders = async () => {
    try {
      setIsLoading(true)
      setError("")
      setResult(null)

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.post(
        "/api/admin/subscription-reminders",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setResult(response.data)
    } catch (error) {
      console.error("Error triggering subscription reminders:", error)
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || "Failed to trigger subscription reminders")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Subscription Reminders</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-start mb-6">
              <Clock className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Subscription Reminder System</h2>
                <p className="text-gray-600">
                  This tool allows you to manually trigger subscription reminder emails to users whose subscriptions are
                  about to expire. The system automatically sends reminders at 7 days, 3 days, and 1 day before
                  expiration.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Automated Schedule</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Subscription reminders are automatically sent daily via a scheduled cron job. This manual trigger
                      is only needed for testing or if you want to force an immediate check.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && result.success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{result.message}</p>
                      <p className="mt-1">
                        <strong>Reminders sent:</strong> {result.remindersSent}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 mr-2" />
                <span>Send subscription reminder emails to users with expiring subscriptions</span>
              </div>
              <button
                onClick={triggerReminders}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Trigger Reminders
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Automated Daily Check</h3>
                  <p className="text-gray-600">
                    The system automatically checks for expiring subscriptions once per day via a scheduled cron job.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Tiered Reminder Schedule</h3>
                  <p className="text-gray-600">
                    Users receive reminders at 7 days, 3 days, and 1 day before their subscription expires.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Personalized Emails</h3>
                  <p className="text-gray-600">
                    Each reminder email is personalized with the user&apos;s name, subscription expiration date, and a direct
                    link to renew.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Duplicate Prevention</h3>
                  <p className="text-gray-600">
                    The system tracks when reminders were last sent to each user to prevent duplicate emails.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}
