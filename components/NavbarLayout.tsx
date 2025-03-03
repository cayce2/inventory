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
  LayoutDashboard, 
  Package, 
  Receipt, 
  BarChart, 
  ShieldCheck, 
  Menu, 
  X
} from "lucide-react"

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
    checkAdminStatus()
    fetchUserEmail()
  }, [])

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
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const closeUserDropdown = () => {
    setIsDropdownOpen(false)
  }

  if (!isLoggedIn) {
    return <>{children}</>
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="w-4 h-4 mr-2" /> },
    { href: "/billing", label: "Billing", icon: <Receipt className="w-4 h-4 mr-2" /> },
    { href: "/reports", label: "Reports", icon: <BarChart className="w-4 h-4 mr-2" /> },
  ]

  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin", icon: <ShieldCheck className="w-4 h-4 mr-2" /> })
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Navbar */}
        <nav className="bg-white border-b border-gray-200 fixed w-full z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                    Inventory Manager
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="relative">
                  <button 
                    onClick={toggleDropdown} 
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 rounded-full p-2 px-4"
                  >
                    <User className="w-5 h-5 mr-2" />
                    <span className="mr-1">{userEmail ? userEmail.split("@")[0] : "Profile"}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={closeUserDropdown}></div>
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                          <p className="font-semibold">{userEmail ? userEmail.split("@")[0] : "User"}</p>
                          <p className="text-xs text-gray-600 mt-1 truncate">{userEmail}</p>
                        </div>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <Settings className="w-4 h-4 mr-2 text-gray-500" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <LogOut className="w-4 h-4 mr-2 text-gray-500" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center sm:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
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
            <div className="sm:hidden bg-white border-b border-gray-200 shadow-lg pb-3">
              <div className="pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="bg-indigo-100 rounded-full p-2">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{userEmail ? userEmail.split("@")[0] : "User"}</div>
                    <div className="text-sm font-medium text-gray-500 truncate max-w-[200px]">{userEmail}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    <Settings className="w-5 h-5 mr-2 text-gray-500" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    <LogOut className="w-5 h-5 mr-2 text-gray-500" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="pt-16 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}