"use client"
import { useState } from "react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("1");

  const sections = [
    {
      id: "1",
      title: "Information We Collect",
      content: "We collect information you provide directly to us when you create a StocksKE account, update your profile, use our inventory management features, or contact us for support. This may include your name, email address, phone number, and business information such as your company name, product data, and sales records."
    },
    {
      id: "2",
      title: "How We Use Your Information",
      content: "We use the information we collect to provide, maintain, and improve StocksKE services, to process your transactions, send you technical notices and support messages, and to respond to your comments and questions. We may also use your information to send you product updates and promotional communications (you can opt out at any time in your account settings)."
    },
    {
      id: "3",
      title: "Information Sharing and Disclosure",
      content: "We do not sell your personal information. We may share your information with trusted service providers who perform services on our behalf (such as payment processors and cloud hosting providers), or when required by Kenyan law or regulation."
    },
    {
      id: "4",
      title: "Data Security",
      content: "We use industry-standard security measures including encryption in transit (HTTPS), hashed passwords, and secure database access controls to help protect your personal information from unauthorized access, disclosure, alteration, and destruction."
    },
    {
      id: "5",
      title: "Your Rights & Data Deletion",
      content: "You have the right to access, correct, or delete your personal data at any time. You can update your profile in Settings, or submit a formal account deletion request. Upon deletion, your data will be permanently removed from our systems within 30 days. You may also email us directly to request data export or deletion."
    },
    {
      id: "6",
      title: "Cookies",
      content: "StocksKE uses cookies and similar technologies to keep you signed in, remember your preferences, and understand how you use our service. You can control cookie settings through your browser, but disabling cookies may limit some features."
    },
    {
      id: "7",
      title: "Changes to this Policy",
      content: "We may update this privacy policy from time to time. If we make significant changes, we will notify you via email or an in-app notification and update the date at the top of this policy."
    },
    {
      id: "8",
      title: "Contact Us",
      content: "If you have any questions about this privacy policy or wish to exercise your data rights, please contact us at support@stockske.com or through our in-app support chat."
    }
  ];

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-blue-100 mt-1">StocksKE — Inventory Management</p>
              <p className="text-blue-200 text-sm mt-2">Last updated: October 9, 2025</p>
            </div>

            <div className="lg:flex">
              {/* Sidebar navigation */}
              <div className="lg:w-1/4 border-r border-gray-200">
                <nav className="sticky top-0 p-4 lg:p-6">
                  <ul className="space-y-1">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            activeSection === section.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {section.id}. {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Delete Account Quick Link */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 px-1">Account Actions</p>
                    <Link
                      href="/delete-account"
                      className="flex items-center w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="mr-2">🗑</span>
                      Delete My Account
                    </Link>
                  </div>
                </nav>
              </div>

              {/* Main content area */}
              <div className="lg:w-3/4 p-6 lg:p-8">
                <div className="max-w-3xl">
                  {sections.map((section) => (
                    <section
                      key={section.id}
                      id={`section-${section.id}`}
                      className={`mb-8 transition-opacity duration-300 ${
                        activeSection === section.id ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                        <span className="flex items-center justify-center bg-blue-600 text-white w-8 h-8 rounded-full mr-3 text-sm">
                          {section.id}
                        </span>
                        {section.title}
                      </h2>
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                        <p className="text-gray-700 leading-relaxed">{section.content}</p>
                      </div>
                    </section>
                  ))}

                  {/* Delete Account Banner */}
                  <div className="mt-6 mb-8 p-5 bg-red-50 border border-red-100 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-1">Want to delete your account?</h3>
                    <p className="text-sm text-red-700 mb-3">
                      You can request permanent deletion of your StocksKE account and all associated data. This action is irreversible.
                    </p>
                    <Link
                      href="/delete-account"
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Request Account Deletion
                    </Link>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-600 mb-4 sm:mb-0">Still have questions about our privacy practices?</p>
                      <Link
                        href="/support"
                        className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      >
                        Contact Us
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}