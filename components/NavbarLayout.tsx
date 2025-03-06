/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
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
  DollarSign,
  Bell,
  Search
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoggedIn(false)
      setIsLoading(false)
      router.push("/login")
      return
    }
    
    // Set logged in state immediately to prevent flickering
    setIsLoggedIn(true)
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      handleLogout()
      return
    }

    try {
      // Verify token with the server
      const response = await fetch("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const data = await response.json()
      
      if (data.valid) {
        setIsLoggedIn(true)
        setUserEmail(data.email)
        setUserName(data.email ? data.email.split("@")[0] : "User")
        await Promise.all([
          checkAdminStatus(),
          fetchUserEmail()
        ])
        setIsLoading(false)
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error("Error verifying token:", error)
      handleLogout()
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
        setUserName(userData.email ? userData.email.split("@")[0] : "User")
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
      setIsLoading(false)
      router.push("/login")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // If not logged in and not on login page, redirect but still render children
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token && pathname !== "/login" && pathname !== "/register") {
      router.push("/login")
    }
  }, [pathname, router])

  // Show login page content directly if on login page
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="w-5 h-5" /> },
    { href: "/billing", label: "Billing", icon: <Receipt className="w-5 h-5" /> },
    { href: "/reports", label: "Reports", icon: <BarChart className="w-5 h-5" /> },
    { href: "/subscription", label: "Subscription", icon: <DollarSign className="w-5 h-5" /> },
  ]

  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin", icon: <ShieldCheck className="w-5 h-5" /> })
  }

  const userInitials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navbar - always show when not on login/register pages */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2 sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <div className="px-2 py-6">
                <Link 
                  href="/dashboard" 
                  className="flex items-center mb-8 text-xl font-bold text-indigo-600"
                >
                  <span className="mr-2 rounded-md bg-indigo-100 p-1">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </span>
                  Inventory Manager
                </Link>
                <nav className="flex flex-col space-y-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive 
                              ? "bg-indigo-50 text-indigo-700" 
                              : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                        >
                          <span className={isActive ? "text-indigo-700" : "text-gray-500"}>
                            {link.icon}
                          </span>
                          {link.label}
                          {link.label === "Admin" && (
                            <Badge variant="outline" className="ml-auto text-xs py-0">
                              Admin
                            </Badge>
                          )}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/dashboard" className="hidden sm:flex items-center mr-8 text-xl font-bold text-indigo-600">
            <span className="mr-2 rounded-md bg-indigo-100 p-1">
              <Package className="h-6 w-6 text-indigo-600" />
            </span>
            Inventory Manager
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center space-x-4 lg:space-x-6 mr-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <TooltipProvider key={link.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={link.href}
                        className={`flex items-center px-2 py-1.5 text-sm font-medium transition-colors relative ${
                          isActive 
                            ? "text-indigo-700" 
                            : "text-gray-700 hover:text-indigo-700"
                        }`}
                      >
                        {link.label}
                        {isActive && (
                          <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-indigo-600" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="flex items-center gap-2">
                      {link.icon}
                      <span>{link.label}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex relative mx-4 flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-9 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative hidden sm:flex">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-600 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
              <span className="sr-only">Notifications</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2 sm:pl-3 sm:pr-2">
                  <Avatar className="h-8 w-8 text-indigo-600 border border-gray-200">
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-flex text-sm font-medium text-gray-700">
                    {userName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-700 cursor-pointer" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-10">
        {children}
      </main>
    </div>
  )
}