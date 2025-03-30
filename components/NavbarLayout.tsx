/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  Settings, 
  User, 
  Bell, 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  BarChart, 
  Ticket, 
  ShieldCheck 
} from "lucide-react"
import axios from "axios"
import NotificationBell from "./Notifications"

interface NavbarLayoutProps {
  children: ReactNode;
}

export default function NavbarLayout({ children }: NavbarLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false) // New state to track if auth check has been done
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth check on login and signup pages
    if (pathname === "/login" || pathname === "/signup") {
      setAuthChecked(true)
      return
    }
    
    // Only check auth status once on initial load
    if (!authChecked) {
      const token = localStorage.getItem("token")
      if (token) {
        checkAuthStatus()
      } else {
        router.push("/login")
      }
      setAuthChecked(true)
    }
  }, [authChecked, pathname])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoggedIn(false)
      router.push("/login")
      return
    }

    try {
      const response = await axios.get("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.valid) {
        setIsLoggedIn(true)
        setUserEmail(response.data.email || "")
        checkAdminStatus()
        if (!response.data.email) {
          fetchUserEmail()
        }
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error("Error verifying token:", error)
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
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  if (!isLoggedIn || !authChecked) {
    return <>{children}</>
  }

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Inventory", href: "/inventory", icon: <Package className="w-5 h-5" /> },
    { name: "Billing", href: "/billing", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Reports", href: "/reports", icon: <BarChart className="w-5 h-5" /> },
    { name: "Subscription", href: "/subscription", icon: <Ticket className="w-5 h-5" /> },
  ]

  const displayName = userEmail ? userEmail.split("@")[0] : "Profile"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="stockske Logo" 
                  width={32} 
                  height={32} 
                  className="mr-2"
                />
                <span className="text-2x font-bold text-indigo-600">STOCKSKE</span>
              </Link>
            </div>
            
            {/* Desktop Navigation Links - Moved to center-right */}
            <div className="hidden sm:flex sm:items-center sm:justify-end sm:flex-4 sm:space-x-6 ml-16">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    pathname === link.href
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    pathname === "/admin"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-indigo-300 hover:text-gray-700"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Admin
                </Link>
              )}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {/* Only show notification bell in desktop view here */}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
              
              {/* Profile dropdown */}
              <div className="relative ml-3 hidden sm:block">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 p-1 px-3 border border-gray-200 hover:bg-gray-50"
                >
                  <User className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-gray-700">{displayName}</span>
                  <ChevronDown className={`ml-1 h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={closeDropdown}
                    ></div>
                    <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeDropdown}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                      <Link
                        href="/notifications"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeDropdown}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button - Notification bell moved to mobile menu */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                    pathname === link.href
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-transparent text-gray-600 hover:border-indigo-300 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.name}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                    pathname === "/admin"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-transparent text-gray-600 hover:border-indigo-300 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <ShieldCheck className="w-5 h-5 mr-3" />
                  Admin
                </Link>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{displayName}</div>
                  <div className="text-sm font-medium text-gray-500">{userEmail}</div>
                </div>
                
                {/* Notification bell in mobile menu */}
                <div className="ml-auto">
                  <NotificationBell />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100"
                  onClick={closeMobileMenu}
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-500" />
                  Settings
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100"
                  onClick={closeMobileMenu}
                >
                  <Bell className="mr-3 h-5 w-5 text-gray-500" />
                  Notifications
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}