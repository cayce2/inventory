/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User, Bell } from "lucide-react";
import axios from "axios";
import NotificationBell from "./Notifications";

import { ReactNode } from "react";

export default function NavbarLayout({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname === "/login" || window.location.pathname === "/signup") return;
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      router.push("/login");
      return;
    }

    try {
      const response = await axios.get("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.valid) {
        setIsLoggedIn(true);
        setUserEmail(response.data.email);
        checkAdminStatus();
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      router.push("/login");
    }
  };

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUserEmail("");
      router.push("/login");
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  if (!isLoggedIn) return <>{children}</>;

  return (
    <>
      <nav className="bg-white shadow-md p-4 sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-gray-800 hover:text-gray-600">
            Inventory Manager
          </Link>
          <div className="flex items-center space-x-6">
            {["Dashboard", "Inventory", "Billing", "Reports", "Subscription"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="text-gray-700 hover:text-gray-900 transition">
                {item}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 transition">
                Admin
              </Link>
            )}
            <NotificationBell />
            <div className="relative">
              <button onClick={toggleDropdown} className="flex items-center px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
                <User className="w-5 h-5 mr-2 text-gray-700" />
                {userEmail.split("@")[0] || "Profile"}
                <ChevronDown className="w-4 h-4 ml-1 text-gray-700" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </Link>
                  <Link href="/notifications" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                    <Bell className="w-4 h-4 mr-2" /> Notifications
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto mt-6 p-4">{children}</main>
    </>
  );
}
