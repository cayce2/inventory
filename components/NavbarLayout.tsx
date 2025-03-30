"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronDown, 
  LogOut, 
  Settings, 
  User, 
  Bell, 
  LayoutDashboard,
  Package,
  Receipt,
  BarChart,
  CreditCard,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react"
import axios from "axios"
import NotificationBell from "./NotificationBell"

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Skip auth check on login and signup pages
    const pathname = window.location.pathname
    if (pathname === "/login" || pathname === "/signup") {
      return
    }

    checkAuthStatus()

    // Add scroll listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoggedIn(false)
      router.push("/login")
      return
    }

    try {
      // Verify token with the server
      const response = await axios.get("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.valid) {
        setIsLoggedIn(true)
        setUserEmail(response.data.email)
        checkAdminStatus()
        fetchUserEmail()
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error("Error verifying token:", error)
      // Clear the invalid token
      localStorage.removeItem("token")
      setIsLoggedIn(false)
      router.push("/login")
    }
  }

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
    }
  }

  const fetchUserEmail = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()
        setUserEmail(userData.email)
      }
    } catch (error) {
      console.error("Error fetching user email:", error)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      localStorage.removeItem("token")
      setIsLoggedIn(false)
      setIsAdmin(false)
      setUserEmail("")
      router.push("/login")
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  if (!isLoggedIn) {
    return <>{children}</>
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="flex flex-col min-h-screen">
      <nav className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md text-gray-800' : 'bg-gradient-to-r from-white-600 to-white-600 text-black'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                {/* Replace Package component with image tag */}
                <img 
                  src="/logo.png"  // Update with your actual image path
                  alt="Logo"
                  className={`w-full h-full object-contain ${isScrolled ? 'filter brightness-75' : ''}`}
                />
              </div>
              <span className={`text-2x font-bold ${isScrolled ? 'text-gray-800' : 'text-black'}`}>
                STOCKSKE
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link href="/inventory" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </Link>
              <Link href="/billing" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
                <Receipt className="w-4 h-4 mr-2" />
                Billing
              </Link>
              <Link href="/reports" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
                <BarChart className="w-4 h-4 mr-2" />
                Reports
              </Link>
              <Link href="/subscription" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
                <CreditCard className="w-4 h-4 mr-2" />
                Subscription
              </Link>
              {isAdmin && (
                <Link href="/admin" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              )}
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <div className="relative">
                <button 
                  onClick={toggleDropdown} 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'} focus:outline-none`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isScrolled ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20'}`}>
                    {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                  </span>
                  <div className="hidden md:block">
                    {userEmail ? (
                      <div className="flex flex-col items-start">
                        <span className="text-sm">{userEmail.split("@")[0]}</span>
                        <span className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-indigo-200'}`}>
                          {isAdmin ? 'Administrator' : 'User'}
                        </span>
                      </div>
                    ) : (
                      "Profile"
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg py-2 z-40 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userEmail}</p>
                      <p className="text-xs text-gray-500">{isAdmin ? 'Administrator Account' : 'Standard Account'}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2 text-gray-400" />
                      Settings
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Bell className="w-4 h-4 mr-2 text-gray-400" />
                      Notifications
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          handleLogout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden rounded-md p-2 inline-flex items-center justify-center focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 flex items-center"
                onClick={closeMobileMenu}
              >
                <LayoutDashboard className="w-5 h-5 mr-3 text-indigo-500" />
                Dashboard
              </Link>
              <Link
                href="/inventory"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 flex items-center"
                onClick={closeMobileMenu}
              >
                <Package className="w-5 h-5 mr-3 text-indigo-500" />
                Inventory
              </Link>
              <Link
                href="/billing"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 flex items-center"
                onClick={closeMobileMenu}
              >
                <Receipt className="w-5 h-5 mr-3 text-indigo-500" />
                Billing
              </Link>
              <Link
                href="/reports"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 flex items-center"
                onClick={closeMobileMenu}
              >
                <BarChart className="w-5 h-5 mr-3 text-indigo-500" />
                Reports
              </Link>
              <Link
                href="/subscription"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 flex items-center"
                onClick={closeMobileMenu}
              >
                <CreditCard className="w-5 h-5 mr-3 text-indigo-500" />
                Subscription
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 flex items-center"
                  onClick={closeMobileMenu}
                >
                  <ShieldCheck className="w-5 h-5 mr-3 text-indigo-500" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-16 flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              &copy; {currentYear} Inventory Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}