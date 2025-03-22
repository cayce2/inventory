"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { Edit, Trash2, AlertTriangle, ArrowLeft } from "lucide-react"
import Image from "next/image"

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
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  useEffect(() => {
    fetchInventory()
  }, [userId])

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // If userId is provided, fetch only that user's inventory
      const endpoint = userId ? `/api/admin/inventory?userId=${userId}` : "/api/admin/inventory"

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInventory(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching inventory:", error)
      setError("An error occurred while fetching inventory items")
      setIsLoading(false)
    }
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
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("An error occurred while deleting the item")
    }
  }

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-8">Admin Inventory Management</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </NavbarLayout>
    )
  }

  if (error) {
    return (
      <NavbarLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-8">Admin Inventory Management</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        </div>
      </NavbarLayout>
    )
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{userId ? "User Inventory Management" : "Admin Inventory Management"}</h1>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search items or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md mr-4"
            />
            <button
              onClick={() => (userId ? router.push(`/admin/users/${userId}`) : router.push("/admin"))}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {userId ? "Back to User" : "Back to Admin"}
            </button>
          </div>
        </div>

        {userId && inventory.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
            <p className="font-bold">Viewing inventory for: {inventory[0].userName || "Unknown User"}</p>
            <p>{inventory[0].userEmail || ""}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Inventory Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-blue-600">{inventory.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600">
                {inventory.filter((item) => item.quantity < item.lowStockThreshold).length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${inventory.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  {!userId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-16 relative">
                        <Image
                          src={`data:image/jpeg;base64,${item.image}`}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{item.quantity}</span>
                        {item.quantity < item.lowStockThreshold && (
                          <AlertTriangle className="ml-2 h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    {!userId && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.userName || "Unknown"}</div>
                        <div className="text-sm text-gray-500">{item.userEmail || "Unknown"}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/inventory/${item._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteItem(item._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}

