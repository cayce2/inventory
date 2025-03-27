/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Edit, Trash2, AlertTriangle, ArrowLeft, Search, Package, DollarSign, AlertCircle, Filter, RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface InventoryItem {
  _id: string
  name: string
  quantity: number
  price: number
  lowStockThreshold: number
  image: string
  userId: string
  userName?: string
  userEmail?: string
}

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export default function AdminInventory() {
  // Note: Do not log inventory data to console as it may contain sensitive information
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof InventoryItem>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const currency = "KES" 
  
  // Adding a ref to track if the component has already performed the initial fetch
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false)

  useEffect(() => {
    // Only fetch on mount or when userId changes, but not on every render
    if (!hasInitiallyFetched) {
      fetchInventory()
      setHasInitiallyFetched(true)
    } else if (userId) {
      // Only refetch when userId actually changes, not on every render
      fetchInventory()
    }
  }, [userId, hasInitiallyFetched])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      setError("")
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const endpoint = userId ? `/api/admin/inventory?userId=${userId}` : "/api/admin/inventory"
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.length === 0 && userId) {
        try {
          await axios.get(`/api/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch (error) {// eslint-disable-line @typescript-eslint/no-unused-vars
          // Error checking user is caught silently
        }
      }

      setInventory(response.data)
      setIsLoading(false)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(`Error: ${error.response.data.error || "Failed to fetch inventory items"}`)
      } else {
        setError("An unexpected error occurred while fetching inventory items")
      }
      setIsLoading(false)
    }
  }

  const refreshInventory = async () => {
    setIsRefreshing(true)
    await fetchInventory()
    setTimeout(() => setIsRefreshing(false), 600) // Add a small delay for better UX
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`/api/admin/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchInventory()
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError("An error occurred while deleting the item")
    }
  }

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: keyof InventoryItem) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  const filteredInventory = inventory
    .filter((item) => {
      // Apply search filter
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Apply low stock filter if enabled
      const matchesLowStock = showLowStockOnly ? item.quantity < item.lowStockThreshold : true
      
      return matchesSearch && matchesLowStock
    })
    .sort((a, b) => {
      // Apply sorting
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      
      const aString = String(aValue || "").toLowerCase()
      const bString = String(bValue || "").toLowerCase()
      return sortDirection === "asc" 
        ? aString.localeCompare(bString) 
        : bString.localeCompare(aString)
    })

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Inventory Management</h1>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Inventory Management</h1>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={refreshInventory}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {userId ? "User Inventory Management" : "Admin Inventory Management"}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search items or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={refreshInventory}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => (userId ? router.push(`/admin/users/${userId}`) : router.push("/admin"))}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                {userId ? "Back to User" : "Back to Admin"}
              </button>
            </div>
          </div>

          {/* User Info Banner */}
          {userId && inventory.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {(inventory[0].userName || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800">
                    {inventory[0].userName || "Unknown User"}
                  </h3>
                  <p className="text-sm text-blue-600">{inventory[0].userEmail || ""}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-50 text-blue-700">
                  <Package className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Items</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{inventory.length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {inventory.filter((item) => item.quantity < item.lowStockThreshold).length}
                  </h3>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-50 text-green-700">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {formatAmount(inventory.reduce((total, item) => total + item.price * item.quantity, 0))}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                  showLowStockOnly 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className={`h-4 w-4 ${showLowStockOnly ? 'text-amber-600' : 'text-gray-500'} mr-1`} />
                Low Stock Only
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-') as [keyof InventoryItem, "asc" | "desc"]
                  setSortField(field)
                  setSortDirection(direction)
                }}
                className="text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="quantity-asc">Quantity (Low to High)</option>
                <option value="quantity-desc">Quantity (High to Low)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Inventory Table/Grid */}
          {filteredInventory.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Item Name {getSortIcon("name")}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center">
                          Quantity {getSortIcon("quantity")}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center">
                          Price {getSortIcon("price")}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      {!userId && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInventory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-16 w-16 relative rounded-md overflow-hidden">
                            <Image
                              src={`data:image/jpeg;base64,${item.image}`}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.quantity < item.lowStockThreshold ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                                {item.quantity} (Low)
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {formatAmount(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {formatAmount(item.price * item.quantity)}
                        </td>
                        {!userId && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{item.userName || "Unknown"}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.userEmail || "Unknown"}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => router.push(`/admin/inventory/${item._id}`)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-colors"
                              title="Edit item"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item._id)} 
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 rounded-full p-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No inventory items found</h3>
                <p className="text-gray-500 max-w-md">
                  {searchTerm 
                    ? "No items match your search criteria. Try a different search term."
                    : userId
                      ? "This user doesn't have any inventory items yet."
                      : "There are no inventory items in the system."}
                </p>
                <div className="mt-6 space-x-3">
                  {userId && (
                    <Link
                      href={`/admin/users/${userId}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to User Details
                    </Link>
                  )}
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NavbarLayout>
  )
}