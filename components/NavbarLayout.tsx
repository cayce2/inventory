/* eslint-disable react-hooks/exhaustive-deps */

"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  ChevronDown, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  BarChart4, 
  Badge,
  Menu,
  X
} from "lucide-react"
import axios from "axios"

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()

  // Check auth status only once when component mounts
  useEffect(() => {
    // Skip auth check on login and signup pages
    if (pathname === "/login" || pathname === "/signup") {
      return
    }

    checkAuthStatus()
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

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
        
        // Run these in parallel for better performance
        await Promise.all([checkAdminStatus(), fetchUserEmail()])
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
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const dropdown = document.getElementById('user-dropdown')
      const button = document.getElementById('dropdown-button')
      
      if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Navigation items with their icons
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Inventory", path: "/inventory", icon: <Package className="w-5 h-5" /> },
    { name: "Billing", path: "/billing", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Reports", path: "/reports", icon: <BarChart4 className="w-5 h-5" /> },
    { name: "Subscription", path: "/subscription", icon: <Badge className="w-5 h-5" /> },
  ]

  // Render the navbar only if logged in
  if (!isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="bg-blue-600 text-white p-2 rounded mr-2">IM</span>
                <span className="text-xl font-bold text-gray-900">Inventory Manager</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.path
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Admin
                </Link>
              )}
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="flex lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* User Profile Dropdown */}
            <div className="relative hidden lg:block">
              <button
                id="dropdown-button"
                onClick={toggleDropdown}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="max-w-[100px] truncate">
                  {userEmail ? userEmail.split("@")[0] : "Profile"}
                </span>
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isDropdownOpen && (
                <div
                  id="user-dropdown"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 z-10"
                >
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2 text-gray-500" />
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-gray-800 bg-opacity-50">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-y-auto">
            <div className="px-4 py-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="space-y-1 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                      pathname === item.path
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
                
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                      pathname === "/admin"
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    Admin
                  </Link>
                )}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Settings className="w-5 h-5 mr-3 text-gray-500" />
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 container mx-auto px-4 py-8 pb-16">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Inventory Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}