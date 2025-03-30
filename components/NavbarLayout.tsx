/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import Link from "next/link"
//import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronDown, 
  LogOut, 
  Settings, 
  User, 
  Bell, 
  Menu, 
  X, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  BarChart3, 
  CreditCard, 
  ShieldCheck 
} from "lucide-react"
import axios from "axios"
import NotificationBell from "./NotificationBell"

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Skip auth check on login and signup pages
    const pathname = window.location.pathname
    if (pathname === "/login" || pathname === "/signup") {
      return
    }

    checkAuthStatus()
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isDropdownOpen && !target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isLoggedIn) {
    return <>{children}</>
  }

  // Navigation links with icons
  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="w-5 h-5" /> },
    { href: "/billing", label: "Billing", icon: <Receipt className="w-5 h-5" /> },
    { href: "/reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/subscription", label: "Subscription", icon: <CreditCard className="w-5 h-5" /> },
  ]
  
  // Admin link (conditionally rendered)
  const adminLink = { href: "/admin", label: "Admin", icon: <ShieldCheck className="w-5 h-5" /> }

  return (
    <>
      {/* Added sticky positioning and z-index */}
      <nav className="bg-white shadow-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand - replaced with image */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                {/* Image Logo */}
                <img 
                  src="/logo.png" 
                  alt="STOCKSKE Logo" 
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-2x font-bold text-blue-700">STOCKSKE</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center space-x-1"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}

              {isAdmin && (
                <Link 
                  href={adminLink.href} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:bg-purple-50 flex items-center space-x-1"
                >
                  {adminLink.icon}
                  <span>{adminLink.label}</span>
                </Link>
              )}
            </div>

            {/* Right side actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <NotificationBell />
              <div className="relative" data-dropdown>
                <button 
                  onClick={toggleDropdown} 
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-1">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="ml-2">{userEmail ? userEmail.split("@")[0] : "Profile"}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-blue-100">
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center">
              <NotificationBell />
              <button
                onClick={toggleMobileMenu}
                className="ml-2 p-2 rounded-md text-blue-700 hover:bg-blue-50 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-blue-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 flex items-center"
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href={adminLink.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 flex items-center"
                >
                  {adminLink.icon}
                  <span className="ml-2">{adminLink.label}</span>
                </Link>
              )}
              
              {/* Mobile user profile section */}
              <div className="border-t border-blue-100 pt-4 pb-2">
                <div className="flex items-center px-3 py-2">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-700">{userEmail ? userEmail : "User"}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 flex items-center"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Settings
                  </Link>
                  <Link
                    href="/notifications"
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 flex items-center"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Notifications
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50 flex items-center"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Added padding-top to ensure content isn't hidden under the sticky navbar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </>
  )
}