/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { CreditCard, Check, AlertCircle, Clock, Package, BarChart, MessageSquare, Shield, Database } from "lucide-react"

export default function Subscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "inactive" | "expired">("inactive")
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/subscription/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSubscriptionStatus(response.data.status)
      setSubscriptionEndDate(response.data.endDate)
    } catch (error) {
      console.error("Error checking subscription status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const initiatePayment = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.post(
        "/api/subscription/initiate",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.data.success) {
        setPaymentInitiated(true)
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renewSubscription = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.post(
        "/api/subscription/renew",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.data.success) {
        checkSubscriptionStatus()
      }
    } catch (error) {
      console.error("Error renewing subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (subscriptionStatus === "active") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Check className="w-4 h-4 mr-1" /> Active
        </span>
      )
    } else if (subscriptionStatus === "expired") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-4 h-4 mr-1" /> Expired
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-4 h-4 mr-1" /> Inactive
        </span>
      )
    }
  }

  const benefits = [
    { icon: <Database className="w-5 h-5 text-indigo-500" />, text: "Real-time inventory tracking" },
    { icon: <BarChart className="w-5 h-5 text-indigo-500" />, text: "Smart dashboard with actionable insights" },
    { icon: <CreditCard className="w-5 h-5 text-indigo-500" />, text: "Seamless billing and invoicing" },
    { icon: <Package className="w-5 h-5 text-indigo-500" />, text: "Comprehensive financial reports" },
    { icon: <MessageSquare className="w-5 h-5 text-indigo-500" />, text: "Priority customer support" },
    { icon: <Shield className="w-5 h-5 text-indigo-500" />, text: "Enhanced security features" },
  ]

  return (
    <NavbarLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-sm text-gray-500">Manage your InventoryPro subscription and billing details</p>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          {/* Status Card */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Subscription Status</h2>
              {getStatusBadge()}
            </div>
            
            {subscriptionEndDate && (
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                <span>
                  {subscriptionStatus === "active" ? "Active until: " : "Expired on: "}
                  <span className="font-medium text-gray-900">
                    {new Date(subscriptionEndDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>
          
          {/* Plan Information */}
          <div className="px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">InventoryPro Premium Plan</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0">{benefit.icon}</div>
                  <p className="ml-3 text-sm text-gray-500">{benefit.text}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-gray-50 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Monthly subscription</p>
                  <p className="text-sm text-gray-500">Billed monthly, cancel anytime</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">2,000 KES</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Section */}
          <div className="px-6 py-5">
            {subscriptionStatus !== "active" && !paymentInitiated && (
              <button
                onClick={subscriptionStatus === "expired" ? renewSubscription : initiatePayment}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {subscriptionStatus === "expired" ? "Renew Subscription" : "Subscribe Now"}
                  </span>
                )}
              </button>
            )}
            
            {subscriptionStatus === "active" && (
              <button
                onClick={renewSubscription}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Renew Subscription
                  </span>
                )}
              </button>
            )}
            
            {paymentInitiated && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex flex-col">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Payment Instructions</h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>Please follow these steps to complete your subscription:</p>
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                          <li>Go to your M-PESA menu</li>
                          <li>Select &apos;Lipa na M-PESA&apos;</li>
                          <li>
                            Enter Til Number: <span className="font-medium">3012364</span>
                          </li>
                          <li>
                            Enter Amount: <span className="font-medium">2000</span>
                          </li>
                          <li>Enter your M-PESA PIN and confirm the transaction</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                  
                
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}