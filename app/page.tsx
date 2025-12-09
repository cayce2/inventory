'use client'
import { useState, useEffect } from 'react';
import Link from "next/link";
import { ChevronRight, BarChart2, Package, Clock, Smartphone, Sparkles, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [, setHoveredFeature] = useState<number | null>(null);
  const [snowflakes, setSnowflakes] = useState<Array<{id: number, left: number, delay: number, duration: number}>>([]);
  const [showChristmas, setShowChristmas] = useState(false);

  useEffect(() => {
    const now = new Date();
    const endDate = new Date('2026-01-05');
    setShowChristmas(now < endDate);
    
    setSnowflakes(Array.from({length: 50}, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10
    })));
  }, []);

  const features = [
    {
      icon: <BarChart2 className="w-7 h-7" />,
      title: "Analytics Dashboard",
      description: "Get real-time insights into your inventory performance",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Package className="w-7 h-7" />,
      title: "Stock Management",
      description: "Track and manage your inventory levels effortlessly",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: "Real-time Updates",
      description: "Stay informed with instant stock level notifications",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Christmas Snowflakes */}
      {showChristmas && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
          {snowflakes.map(flake => (
            <div
              key={flake.id}
              className="absolute text-white text-opacity-80 animate-fall"
              style={{
                left: `${flake.left}%`,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
                fontSize: `${Math.random() * 10 + 10}px`
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Christmas Banner */}
          {showChristmas && (
            <div className="mb-6 animate-bounce-slow">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-full shadow-lg animate-pulse-slow">
                <span className="text-2xl animate-spin-slow">🎄</span>
                <span className="text-lg font-bold text-white drop-shadow-lg">Merry Christmas & Happy Holidays!</span>
                <span className="text-2xl animate-spin-slow">🎅</span>
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200/50 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Modern Inventory Management</span>
          </div>
          
          <h1 className="text-7xl md:text-7xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 leading-tight tracking-tight">
            Inventory Manager
          </h1>
          <p className="text-xl md:text-xl text-gray-700 mb-14 leading-relaxed max-w-2xl mx-auto font-light">
            Streamline your inventory management with our powerful system.
            Track stock levels, manage billing, and gain actionable insights.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
            <Link 
              href="/login" 
              className="group relative inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-10 rounded-2xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto"
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 font-semibold py-4 px-10 rounded-2xl text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 w-full sm:w-auto"
            >
              Sign Up Free
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 justify-center items-center">
            <a
              href="https://expo.dev/artifacts/eas/b4FXPseyj2XC84Ph9wKBhE.apk"
              download="stockske.apk"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-green-200/50 shadow-sm hover:bg-white/80 transition-all"
            >
              <Smartphone className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Android App</span>
              <Download className="w-4 h-4 text-green-600" />
            </a>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm opacity-60">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">iOS - Coming Soon</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-6 bg-white/40 backdrop-blur-sm inline-block px-4 py-2 rounded-full">
            Android app is in development but functional. All features might not be available.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group relative overflow-hidden transition-all duration-500 transform hover:-translate-y-2 bg-white/70 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl cursor-pointer"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <CardContent className="p-8 relative z-10">
                <div className={`mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-gray-900 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.8; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-fall { animation: fall linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
      `}</style>
    </div>
  );
}