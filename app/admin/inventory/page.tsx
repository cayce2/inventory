"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Edit, Trash2, AlertTriangle, ArrowLeft, Search, Package, DollarSign, AlertCircle, Plus, RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

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

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  useEffect(() => {
    fetchInventory()
  }, [userId])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const endpoint = userId ? `/api/admin/inventory?userId=${userId}` : "/api/admin/inventory"
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setInventory(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching inventory:", error)
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
    setTimeout(() => setIsRefreshing(false), 500) // Visual feedback
  }

  const openDeleteModal = (itemId: string) => {
    setItemToDelete(itemId)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`/api/admin/inventory/${itemToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      await fetchInventory()
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("An error occurred while deleting the item")
      setIsDeleteModalOpen(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Filter and sort inventory
  const processedInventory = inventory
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy as keyof InventoryItem];
      const bVal = b[sortBy as keyof InventoryItem];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

  // Calculate statistics
  const totalItems = inventory.length
  const lowStockItems = inventory.filter((item) => item.quantity < item.lowStockThreshold).length
  const totalValue = inventory.reduce((total, item) => total + item.price * item.quantity, 0)

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Admin Inventory</h1>
              <button
                onClick={() => (userId ? router.push(`/admin/users/${userId}`) : router.push("/admin"))}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition duration-200"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Error Loading Inventory</h3>
                  <p>{error}</p>
                  <button 
                    onClick={fetchInventory}
                    className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md inline-flex items-center transition duration-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {userId ? "User Inventory" : "Admin Inventory"}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search items or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshInventory}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2 px-4 rounded-lg flex items-center transition duration-200"
                >
                  <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                {!userId && (
                  <button
                    onClick={() => router.push("/admin/inventory/add")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition duration-200"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Item
                  </button>
                )}
                <button
                  onClick={() => (userId ? router.push(`/admin/users/${userId}`) : router.push("/admin"))}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition duration-200"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* User Info Banner */}
          {userId && inventory.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-sm mb-6"
            >
              <p className="font-semibold text-lg">{inventory[0].userName || "Unknown User"}</p>
              <p className="text-blue-600">{inventory[0].userEmail || ""}</p>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200"
            >
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200"
            >
              <div className="flex items-start">
                <div className="bg-amber-100 p-3 rounded-lg mr-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Low Stock Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{lowStockItems}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200"
            >
              <div className="flex items-start">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">${totalValue.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Inventory Table */}
          {processedInventory.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Item Name
                          {sortBy === "name" && (
                            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center">
                          Quantity
                          {sortBy === "quantity" && (
                            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center">
                          Price
                          {sortBy === "price" && (
                            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      {!userId && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort("userName")}
                        >
                          <div className="flex items-center">
                            Owner
                            {sortBy === "userName" && (
                              <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedInventory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-16 w-16 relative rounded-lg overflow-hidden">
                            <Image
                              src={`data:image/jpeg;base64,${item.image}`}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              item.quantity < item.lowStockThreshold ? "text-amber-600" : "text-gray-900"
                            }`}>
                              {item.quantity}
                            </span>
                            {item.quantity < item.lowStockThreshold && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        {!userId && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.userName || "Unknown"}</div>
                            <div className="text-sm text-gray-500">{item.userEmail || "Unknown"}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/admin/inventory/${item._id}`)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg mr-2 transition duration-150"
                            aria-label="Edit item"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(item._id)} 
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition duration-150"
                            aria-label="Delete item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No inventory items found</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  {userId
                    ? "This user doesn't have any inventory items yet."
                    : "There are no inventory items in the system matching your search."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 mb-4"
                  >
                    Clear Search
                  </button>
                )}
                {userId && (
                  <Link
                    href={`/admin/users/${userId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to User Details
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </NavbarLayout>
  )
}