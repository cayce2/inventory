"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Mail,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  ShieldCheck,
  MessageSquare,
} from "lucide-react"

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [reason, setReason] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [requestId, setRequestId] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (confirmText !== "DELETE MY ACCOUNT") {
      setError('Please type exactly: DELETE MY ACCOUNT')
      return
    }

    setIsLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, password, reason }),
      })

      const data = await res.json()

      if (res.ok) {
        setRequestId(data.requestId || `REQ-${Date.now()}`)
        setSubmitted(true)
        if (typeof window !== "undefined") localStorage.removeItem("token")
      } else {
        setError(data.error || "Failed to submit request. Please try again.")
      }
    } catch {
      setError("A network error occurred. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const dataTable = [
    {
      category: "Account & Profile",
      examples: "Name, email address, phone number, password",
      action: "Deleted",
      retention: "Within 30 days",
      kept: false,
    },
    {
      category: "Inventory & Products",
      examples: "Items, stock levels, categories, restock history",
      action: "Deleted",
      retention: "Within 30 days",
      kept: false,
    },
    {
      category: "Invoices & Sales",
      examples: "Invoices, POS transactions, billing records",
      action: "Deleted",
      retention: "Within 30 days",
      kept: false,
    },
    {
      category: "Reports & Analytics",
      examples: "Generated reports, revenue charts, trends",
      action: "Deleted",
      retention: "Within 30 days",
      kept: false,
    },
    {
      category: "Sub-user Accounts",
      examples: "Linked staff or sub-accounts under your organisation",
      action: "Deleted",
      retention: "Within 30 days",
      kept: false,
    },
    {
      category: "Subscription Records",
      examples: "Plan history, payment references (not card numbers)",
      action: "Kept",
      retention: "Up to 7 years",
      kept: true,
      reason: "Required for financial compliance and fraud prevention under Kenyan law.",
    },
    {
      category: "Security & Audit Logs",
      examples: "Login history, IP logs, admin actions",
      action: "Kept",
      retention: "Up to 90 days",
      kept: true,
      reason: "Retained for security investigation purposes, then permanently deleted.",
    },
  ]

  const faqs = [
    {
      q: "Can I cancel the deletion after submitting?",
      a: "Yes. You have a 7-day grace period from the time of your request. Email support@stockske.com with your reference number to cancel.",
    },
    {
      q: "Will I receive a refund for unused subscription time?",
      a: "No. Account deletion does not trigger a refund for any remaining subscription period. Consider cancelling your subscription first if applicable.",
    },
    {
      q: "Can I re-register with the same email after deletion?",
      a: "Yes. Once your data has been fully deleted (within 30 days), you can create a new StocksKE account with the same email address.",
    },
    {
      q: "What if I don't remember my password?",
      a: "Password is optional on the deletion form. Providing your registered email address is sufficient to submit a deletion request.",
    },
    {
      q: "How will I know when my data is deleted?",
      a: "We'll send a confirmation email when your deletion request is received, and a second email when the permanent deletion is complete.",
    },
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-lg w-full p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Request Submitted</h2>
            <p className="text-gray-500 text-sm mt-1">
              Reference:{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs text-gray-800">
                {requestId}
              </code>
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 text-sm">
            <p className="font-semibold text-gray-900">What happens next</p>
            {[
              "A confirmation email has been sent to your registered address.",
              "Your account is now deactivated and you have been signed out.",
              "All personal data will be permanently deleted within 30 days.",
              "You can cancel within 7 days by emailing support@stockske.com with your reference number.",
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-gray-600">{step}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a href="mailto:support@stockske.com" className="text-indigo-600 hover:underline">
              support@stockske.com
            </a>
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">SK</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">StocksKE</span>
            <span className="text-gray-300 text-sm">·</span>
            <span className="text-gray-500 text-sm">Delete Account</span>
          </div>
          <Link href="/support" className="text-sm text-indigo-600 hover:underline">
            Contact Support
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Delete Your StocksKE Account</h1>
                <p className="text-red-200 text-sm mt-0.5">StocksKE — Inventory Management by Cayce</p>
              </div>
            </div>
            <p className="text-red-100 text-sm leading-relaxed max-w-xl">
              This page lets you permanently delete your StocksKE account and all associated business data.
              Please read the steps and data policy below before submitting your request.
            </p>
          </div>

          <div className="p-5 bg-amber-50 border-b border-amber-100 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>This action is permanent and irreversible.</strong> Once your account is deleted,
              your inventory, invoices, reports, and all other data cannot be recovered.
            </p>
          </div>
        </div>

        {/* ── Steps ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 bg-indigo-100 rounded-md flex items-center justify-center">
              <span className="text-indigo-600 text-xs font-bold">①</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">How to request account deletion</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />,
                title: "Option A — Through the app (recommended)",
                steps: [
                  "Open the StocksKE app and sign in to your account.",
                  'Navigate to Settings (tap the menu icon → Settings).',
                  'Select the "Profile" tab.',
                  'Scroll to the "Danger Zone" section at the bottom.',
                  'Tap "Delete Account" and follow the confirmation steps.',
                ],
              },
              {
                icon: <Mail className="h-5 w-5 text-indigo-500" />,
                title: "Option B — Using this page (no login required)",
                steps: [
                  "Fill in the deletion request form below.",
                  "Enter your registered StocksKE email address.",
                  'Type "DELETE MY ACCOUNT" in the confirmation field.',
                  "Submit the form — you will receive a reference number.",
                  "A confirmation email will be sent to your registered address within 24 hours.",
                ],
              },
              {
                icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
                title: "Option C — Email support",
                steps: [
                  "Send an email to support@stockske.com.",
                  'Use the subject line: "Account Deletion Request".',
                  "Include your registered email address in the message.",
                  "Our team will process your request within 2 business days.",
                ],
              },
            ].map((option, oi) => (
              <div key={oi} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  {option.icon}
                  <p className="text-sm font-semibold text-gray-900">{option.title}</p>
                </div>
                <ol className="space-y-1.5">
                  {option.steps.map((s, si) => (
                    <li key={si} className="flex gap-2.5 text-sm text-gray-600">
                      <span className="flex-shrink-0 font-mono text-gray-400 text-xs mt-0.5">{si + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* ── Data table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 bg-indigo-100 rounded-md flex items-center justify-center">
              <span className="text-indigo-600 text-xs font-bold">②</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">What data is deleted and what is kept</h2>
          </div>

          <div className="flex gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-gray-500">Permanently deleted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-gray-500">Temporarily retained</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">Data Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide hidden sm:table-cell">Examples</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dataTable.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${row.kept ? "bg-amber-400" : "bg-red-500"}`} />
                        <span className="font-medium text-gray-800">{row.category}</span>
                      </div>
                      {row.reason && (
                        <p className="text-xs text-gray-400 mt-1 ml-4">{row.reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{row.examples}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.kept
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        {row.retention}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <Database className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              Financial and compliance records are retained per Kenyan law requirements.
              All other personal data is permanently and irreversibly deleted within 30 days of your request.{" "}
              <Link href="/privacy" className="text-indigo-600 hover:underline">View Privacy Policy →</Link>
            </p>
          </div>
        </div>

        {/* ── Request form ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="request-form">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 bg-indigo-100 rounded-md flex items-center justify-center">
                <span className="text-indigo-600 text-xs font-bold">③</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900">Submit your deletion request</h2>
            </div>
            <p className="text-sm text-gray-500 ml-8">
              No login required. Fill in the form below — we will verify your ownership via email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Registered Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="the email you used to sign up to StocksKE"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-gray-400 font-normal">(optional — helps verify ownership faster)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Your StocksKE password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for leaving <span className="text-gray-400 font-normal">(optional — helps us improve)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                placeholder="e.g. I'm switching to a different app, I no longer run a business, etc."
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-red-800">
                Type{" "}
                <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs tracking-widest">
                  DELETE MY ACCOUNT
                </code>{" "}
                to confirm <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="block w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none font-mono tracking-widest"
                placeholder="DELETE MY ACCOUNT"
                required
              />
              <p className="text-xs text-red-600">Must match exactly — uppercase, no extra spaces.</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">By submitting this form you confirm that:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>You are the account owner or authorised to act on behalf of this account.</li>
                <li>You understand that deletion is permanent and no data recovery will be possible after 30 days.</li>
                <li>You will not receive a refund for any remaining subscription period.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || confirmText !== "DELETE MY ACCOUNT" || !email}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Submitting request...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Submit Account Deletion Request
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Changed your mind?{" "}
              <Link href="/" className="text-indigo-600 hover:underline">
                Go back to StocksKE
              </Link>
            </p>
          </form>
        </div>

        {/* ── FAQ ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors"
                >
                  {faq.q}
                  {faqOpen === i
                    ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />
                    : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-3" />}
                </button>
                {faqOpen === i && (
                  <p className="pb-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 mt-6 py-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} StocksKE. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
            <a href="mailto:support@stockske.com" className="hover:text-gray-700 transition-colors">support@stockske.com</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
