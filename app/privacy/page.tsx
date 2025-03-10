"use client"
import { useState } from "react"

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("1");

  const sections = [
    {
      id: "1",
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, update your profile, use our interactive features, or contact us for support. This may include your name, email, phone number, and business information."
    },
    {
      id: "2",
      title: "How We Use Your Information",
      content: "We use the information we collect to provide, maintain, and improve our services, to process your transactions, to send you technical notices and support messages, and to respond to your comments and questions."
    },
    {
      id: "3",
      title: "Information Sharing and Disclosure",
      content: "We do not share your personal information with third parties except as described in this policy. We may share your information with service providers who perform services on our behalf, or when required by law."
    },
    {
      id: "4",
      title: "Data Security",
      content: "We use reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction."
    },
    {
      id: "5",
      title: "Your Choices",
      content: "You may update, correct, or delete your account information at any time by logging into your account. You may also contact us to request access to, correction of, or deletion of any personal information that you have provided to us."
    },
    {
      id: "6",
      title: "Cookies",
      content: "We use cookies and similar technologies to collect information about how you use our service and to remember your preferences."
    },
    {
      id: "7",
      title: "Changes to this Policy",
      content: "We may change this privacy policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy."
    },
    {
      id: "8",
      title: "Contact Us",
      content: "If you have any questions about this privacy policy, please contact us at [Your Contact Information]."
    }
  ];

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-blue-100 mt-2">Last updated: March 10, 2025</p>
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

                  <div className="mt-10 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-600 mb-4 sm:mb-0">Still have questions about our privacy practices?</p>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                        Contact Us
                      </button>
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