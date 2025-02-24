import React from "react";
import Link from "next/link";
import { Package2, BarChart3, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      icon: <Package2 className="h-6 w-6" />,
      title: "Stock Management",
      description: "Track inventory levels in real-time with automated alerts and notifications"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "Gain insights with comprehensive reporting and trend analysis"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Real-time Updates",
      description: "Stay synchronized with instant updates across all devices"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Work seamlessly with your team through shared access and roles"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm fixed w-full z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold text-xl text-slate-900">InventoryPro</div>
          <div className="space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4">
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Manage Inventory
            <span className="text-blue-600"> Smarter</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Streamline your inventory management with our powerful, easy-to-use platform. 
            Track, analyze, and optimize your stock in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-lg shadow-slate-200">
              <CardContent className="pt-6">
                <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="py-20 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600">10k+</div>
              <div className="text-slate-600">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600">1M+</div>
              <div className="text-slate-600">Items Tracked</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600">99.9%</div>
              <div className="text-slate-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            © 2025 InventoryPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}