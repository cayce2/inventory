/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  CreditCard,
  BarChart4,
  Badge,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronDown
} from 'lucide-react'

// Type definitions
interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  description: string
}

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  // State Management
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Routing
  const router = useRouter()
  const pathname = usePathname()

  // Navigation Items
  const navItems: NavItem[] = [
    { 
      name: "Dashboard", 
      path: "/dashboard", 
      icon: <LayoutDashboard className="w-5 h-5 transition-transform group-hover:scale-110" />,
      description: "Overview of your workspace"
    },
    { 
      name: "Inventory", 
      path: "/inventory", 
      icon: <Package className="w-5 h-5 transition-transform group-hover:scale-110" />,
      description: "Manage your product stock"
    },
    { 
      name: "Billing", 
      path: "/billing", 
      icon: <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110" />,
      description: "Financial transactions"
    },
    { 
      name: "Reports", 
      path: "/reports", 
      icon: <BarChart4 className="w-5 h-5 transition-transform group-hover:scale-110" />,
      description: "Analytical insights"
    },
    { 
      name: "Subscription", 
      path: "/subscription", 
      icon: <Badge className="w-5 h-5 transition-transform group-hover:scale-110" />,
      description: "Manage your plan"
    }
  ]

  // Authentication Methods
  useEffect(() => {
    // Skip auth check on login and signup pages
    if (pathname === "/login" || pathname === "/signup") {
      return
    }

    checkAuthStatus()
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

  // UI Interaction Methods
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Render logic
  if (!isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link 
              href="/dashboard" 
              className="flex items-center group transition-all duration-300 hover:scale-[1.02]"
            >
              <Image 
                src="/favicon.ico" 
                alt="Logo" 
                width={40} 
                height={40} 
                className="mr-3 group-hover:rotate-6 transition-transform"
              />
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Inventory Manager
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group relative flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.path
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {pathname !== item.path && (
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>
                  )}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`group relative flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === "/admin"
                      ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                      : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                  }`}
                >
                  <Settings className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
                  Admin
                </Link>
              )}
            </nav>
            
            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden">
              <motion.button
                onClick={toggleMobileMenu}
                whileTap={{ scale: 0.9 }}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </motion.button>
            </div>
            
            {/* User Profile Dropdown */}
            <div className="relative hidden lg:block">
              <motion.button
                id="dropdown-button"
                onClick={toggleDropdown}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 shadow-sm">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : <UserCircle />}
                </div>
                <span className="max-w-[100px] truncate">
                  {userEmail ? userEmail.split("@")[0] : "Profile"}
                </span>
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 ml-1" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    id="user-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3 text-gray-500" />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-gray-800 bg-opacity-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="absolute inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl"
            >
              <div className="px-4 py-6">
                {/* Mobile User Info */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : <UserCircle />}
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
                
                {/* Mobile Navigation Items */}
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
                
                {/* Mobile Menu Footer */}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 pb-16 max-w-7xl">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 py-6">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Inventory Manager. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}