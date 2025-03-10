"use client"
import { Shield, Edit, Trash2, Database, XCircle, AlertOctagon, AlertTriangle } from "lucide-react";

export default function RightsPage() {
  const rightsData = [
    {
      id: 1,
      title: "Access to Your Data",
      description: "You have the right to access the personal data we hold about you. You can request a copy of your data at any time.",
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 2,
      title: "Data Correction",
      description: "If you believe that any information we hold about you is incorrect or incomplete, you have the right to ask us to correct it.",
      icon: <Edit className="w-6 h-6" />
    },
    {
      id: 3,
      title: "Data Deletion",
      description: "You have the right to request the deletion of your personal data under certain circumstances, such as when the data is no longer necessary for the purposes for which it was collected.",
      icon: <Trash2 className="w-6 h-6" />
    },
    {
      id: 4,
      title: "Data Portability",
      description: "You have the right to receive your personal data in a structured, commonly used, and machine-readable format, and to transmit this data to another controller without hindrance.",
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 5,
      title: "Withdraw Consent",
      description: "If we are processing your data based on your consent, you have the right to withdraw that consent at any time.",
      icon: <XCircle className="w-6 h-6" />
    },
    {
      id: 6,
      title: "Object to Processing",
      description: "You have the right to object to the processing of your personal data in certain circumstances, including for direct marketing purposes.",
      icon: <AlertOctagon className="w-6 h-6" />
    },
    {
      id: 7,
      title: "Complaint to a Supervisory Authority",
      description: "You have the right to lodge a complaint with a supervisory authority if you believe that the processing of your personal data infringes on data protection regulations.",
      icon: <AlertTriangle className="w-6 h-6" />
    }
  ];

  return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">User Rights</h1>
            <p className="mt-4 text-xl text-gray-500">Understanding your data protection rights</p>
          </div>

          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="divide-y divide-gray-200">
              {rightsData.map((right) => (
                <div key={right.id} className="p-6 hover:bg-gray-50 transition duration-150">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                        {right.icon}
                      </div>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-medium text-gray-900">{right.id}. {right.title}</h2>
                      <p className="mt-2 text-base text-gray-500">{right.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Exercise Your Rights
            </button>
            <p className="mt-4 text-sm text-gray-500">
              If you have any questions about your rights, please contact our data protection officer.
            </p>
          </div>
        </div>
      </div>
  );
}