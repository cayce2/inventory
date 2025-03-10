"use client"

export default function TermsPage() {
  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-indigo-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold tracking-tight">Terms and Conditions</h1>
            <p className="mt-2 text-indigo-100">Last updated: March 10, 2025</p>
          </div>
          
          {/* Content Container */}
          <div className="p-6 md:p-8 lg:p-10">
            <div className="prose prose-indigo max-w-none">
              {/* Table of Contents */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contents</h3>
                <nav className="flex flex-col space-y-1">
                  {[...Array(9)].map((_, i) => (
                    <a key={i} href={`#section-${i+1}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                      {i+1}. {["Acceptance of Terms", "Description of Service", "User Accounts", 
                              "Privacy Policy", "Intellectual Property", "Termination", 
                              "Limitation of Liability", "Governing Law", "Changes to Terms"][i]}
                    </a>
                  ))}
                </nav>
              </div>
              
              {/* Terms Sections */}
              {[
                {
                  title: "Acceptance of Terms",
                  content: "By accessing or using our inventory management system, you agree to be bound by these Terms and Conditions."
                },
                {
                  title: "Description of Service",
                  content: "Our inventory management system provides tools for tracking stock levels, managing billing, and analyzing business performance."
                },
                {
                  title: "User Accounts",
                  content: "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account."
                },
                {
                  title: "Privacy Policy",
                  content: "Your use of the service is also governed by our Privacy Policy, which is incorporated into these Terms by reference."
                },
                {
                  title: "Intellectual Property",
                  content: "The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws."
                },
                {
                  title: "Termination",
                  content: "We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms."
                },
                {
                  title: "Limitation of Liability",
                  content: "In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service."
                },
                {
                  title: "Governing Law",
                  content: "These Terms shall be governed and construed in accordance with the laws of the Kenyan constitution, without regard to its conflict of law provisions."
                },
                {
                  title: "Changes to Terms",
                  content: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion."
                },
              ].map((section, index) => (
                <section key={index} id={`section-${index+1}`} className="mb-8 pb-6 border-b border-gray-200 last:border-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="flex items-center justify-center mr-3 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">{index+1}</span>
                    {section.title}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </section>
              ))}
            </div>
            
            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>If you have any questions about these Terms, please contact us.</p>
              <button className="mt-4 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}