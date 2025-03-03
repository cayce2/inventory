"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, LayoutDashboard, Package, CreditCard, BarChart2, Shield, Settings, LogOut, User, ChevronDown, Bell } from "lucide-react"

interface UserInfo {
  name: string
  email: string
}

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
    if (token) {
      checkAdminStatus()
      fetchUserInfo()
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
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
  

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        localStorage.removeItem("token")
        setIsLoggedIn(false)
        setIsAdmin(false)
        setUser(null)
        router.push("/")
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
    if (isNotificationOpen) setIsNotificationOpen(false)
  }

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen)
    if (isDropdownOpen) setIsDropdownOpen(false)
  }

  if (!isLoggedIn) {
    return <>{children}</>
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U"
    
    const nameParts = user.name.split(" ")
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/inventory", label: "Inventory", icon: <Package size={18} /> },
    { href: "/billing", label: "Billing", icon: <CreditCard size={18} /> },
    { href: "/reports", label: "Reports", icon: <BarChart2 size={18} /> },
  ]

  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin", icon: <Shield size={18} /> })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-indigo-600 font-bold text-xl">Inventory Manager</span>
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-2">
              <button 
                onClick={toggleNotifications}
                className="p-2 rounded-full text-slate-600 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none relative"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {isNotificationOpen && (
                <div className="absolute right-16 top-14 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-10 border border-slate-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-slate-50 border-l-4 border-indigo-500">
                      <p className="text-sm font-medium text-slate-900">Inventory update</p>
                      <p className="text-xs text-slate-500 mt-1">5 items are running low on stock</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50">
                      <p className="text-sm font-medium text-slate-900">New order received</p>
                      <p className="text-xs text-slate-500 mt-1">Order #12345 has been placed</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">View all notifications</a>
                  </div>
                </div>
              )}

              <div className="relative ml-3">
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 focus:outline-none transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-medium">
                    {getUserInitials()}
                  </div>
                  <ChevronDown className="w-4 h-4 ml-1 text-slate-600" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-10 border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || 'No email'}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <User className="w-4 h-4 mr-2 text-slate-500" />
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2 text-slate-500" />
                      Settings
                    </Link>
                    <div className="border-t border-slate-100 mt-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
          <div className="pt-2 pb-3 space-y-1 border-t border-slate-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center px-4 py-2 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-medium">
                  {getUserInitials()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-slate-800">{user?.name || 'User'}</div>
                <div className="text-sm font-medium text-slate-500">{user?.email || 'No email'}</div>
              </div>
              <button
                onClick={toggleNotifications}
                className="ml-auto p-1 rounded-full text-slate-600 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none relative"
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User size={18} className="mr-3" />
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings size={18} className="mr-3" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-slate-50"
              >
                <LogOut size={18} className="mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}