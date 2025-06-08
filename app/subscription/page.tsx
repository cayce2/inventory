/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"

export default function Subscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "inactive" | "expired">("inactive")
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
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
    }
  }

  const initiatePayment = async () => {
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
        },
      )
      if (response.data.success) {
        setShowPaymentModal(true)
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
    }
  }

  const handleSubscriptionAction = async () => {
    await initiatePayment()
  }

  const getStatusBadge = () => {
    switch (subscriptionStatus) {
      case "active": 
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Active
          </div>
        )
      case "expired": 
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium border border-red-200">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Expired
          </div>
        )
      default: 
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Inactive
          </div>
        )
    }
  }

  // Payment Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-600">Follow these steps to complete your {subscriptionStatus === "expired" ? "renewal" : "subscription"} via M-PESA</p>
            </div>

            {/* Payment Steps */}
            <div className="space-y-4 mb-6">
              {[
                "Open M-PESA menu on your phone",
                "Select 'Lipa na M-PESA'",
                "Choose 'Pay Bill'",
                "Enter Business Number: 3012364",
                "Account Number: Your registered email",
                "Amount: 2000 KES",
                "Enter PIN and confirm"
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-7 h-7 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 font-medium text-sm">{step}</p>
                </div>
              ))}
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm mb-1">Activation Timeline</h4>
                  <p className="text-sm text-blue-800">
                    Your subscription will be activated within 24 hours after payment confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  // Optionally refresh subscription status after some time
                  setTimeout(() => {
                    checkSubscriptionStatus()
                  }, 1000)
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
              >
                Payment Sent
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          {/* Modern Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Subscription</h1>
            </div>
            <p className="text-gray-600 text-lg">Manage your InventoryPro plan and billing</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Status Card - Redesigned */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Current Plan</h2>
                      <p className="text-gray-600">Your subscription details and status</p>
                    </div>
                    {getStatusBadge()}
                  </div>

                  {subscriptionEndDate && (
                    <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-100 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v8a1 1 0 001 1h4a1 1 0 001-1V8m-6 0H6a1 1 0 00-1 1v8a1 1 0 001 1h1m12-9h1a1 1 0 011 1v8a1 1 0 01-1 1h-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">{subscriptionStatus === "active" ? "Renews on" : "Expired on"}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(subscriptionEndDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptionStatus === "active" ? (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">All Set!</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">Your subscription is active and you have full access to all InventoryPro features.</p>
                      <button
                        onClick={handleSubscriptionAction}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Extend Subscription
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {subscriptionStatus === "expired" ? "Subscription Expired" : "Get Started Today"}
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        {subscriptionStatus === "expired" 
                          ? "Renew your subscription to continue accessing all features." 
                          : "Subscribe now to unlock all InventoryPro features and start managing your inventory like a pro."
                        }
                      </p>
                      <div className="space-y-4">
                        <button
                          onClick={handleSubscriptionAction}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-lg transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25"
                        >
                          {subscriptionStatus === "expired" ? "Renew Subscription" : "Subscribe Now"}
                        </button>
                        <p className="text-center text-sm text-gray-500">30-day money-back guarantee</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="bg-white border border-gray-200/50 rounded-2xl p-6 shadow-sm">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                  <div className="flex items-end justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">2,000</span>
                    <span className="text-gray-500 font-medium pb-1">KES/month</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Full access to all features</p>
                </div>
              </div>

              {/* Features List */}
              <div className="bg-white border border-gray-200/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">What&apos;s Included</h3>
                <div className="space-y-4">
                  {[
                    { icon: "📊", title: "Real-time Tracking", desc: "Monitor inventory in real-time" },
                    { icon: "🎯", title: "Smart Dashboard", desc: "Actionable insights at a glance" },
                    { icon: "💸", title: "Billing & Invoicing", desc: "Seamless financial management" },
                    { icon: "📈", title: "Financial Reports", desc: "Comprehensive analytics" },
                    { icon: "🎧", title: "Priority Support", desc: "Get help when you need it" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                        <p className="text-gray-600 text-xs">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal />
      </div>
    </NavbarLayout>
  )
}