/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, Settings, User, Bell } from "lucide-react"
import axios from "axios"
import NotificationBell from "./Notifications"

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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

  if (!isLoggedIn) {
    return <>{children}</>
  }

  return (
    <>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold">
            Inventory Manager
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/inventory" className="hover:text-gray-300">
              Inventory
            </Link>
            <Link href="/billing" className="hover:text-gray-300">
              Billing
            </Link>
            <Link href="/reports" className="hover:text-gray-300">
              Reports
            </Link>
            <Link href="/subscription" className="hover:text-gray-300">
              Subscription
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hover:text-gray-300">
                Admin
              </Link>
            )}
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <div className="relative">
                <button onClick={toggleDropdown} className="flex items-center hover:text-gray-300 focus:outline-none">
                  <User className="w-5 h-5 mr-1" />
                  {userEmail ? userEmail.split("@")[0] : "Profile"}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto mt-8">{children}</main>
    </>
  )
}

