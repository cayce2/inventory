'use client'
import { useState } from 'react';
import Link from "next/link";
import { ChevronRight, BarChart2, Package, Clock, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Get real-time insights into your inventory performance"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Stock Management",
      description: "Track and manage your inventory levels effortlessly"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Updates",
      description: "Stay informed with instant stock level notifications"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Inventory Manager
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Streamline your inventory management process with our powerful and easy-to-use system.
            Track stock levels, manage billing, and gain insights into your business performance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/login" 
              className="group relative inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-all duration-300 w-full sm:w-auto"
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-8 rounded-full text-lg border-2 border-gray-200 transition-all duration-300 w-full sm:w-auto"
            >
              Sign Up Free
            </Link>
            <a
              href="https://expo.dev/artifacts/eas/b4FXPseyj2XC84Ph9wKBhE.apk"
              download="stockske.apk"
              className="group inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-all duration-300 w-full sm:w-auto"
            >
              <Smartphone className="mr-2 w-5 h-5" />
              Android
            </a>
            <button
              disabled
              className="inline-flex items-center justify-center bg-gray-400 text-white font-medium py-3 px-8 rounded-full text-lg cursor-not-allowed w-full sm:w-auto"
            >
              <Smartphone className="mr-2 w-5 h-5" />
              iOS - Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                hoveredFeature === index ? 'shadow-lg' : 'shadow-md'
              }`}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardContent className="p-6">
                <div className="mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}