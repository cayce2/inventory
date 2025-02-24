/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { 
  Plus, Edit, Trash2, Search, Package, DollarSign, 
  AlertTriangle, X, Save, ArrowLeft, ChevronDown,
  SlidersHorizontal, RefreshCcw
} from "lucide-react"
import NavbarLayout from "@/components/NavbarLayout"
import { AnimatePresence, motion } from "framer-motion"

interface InventoryItem {
  _id: string
  name: string
  quantity: number
  price: number
  imageUrl: string
  lowStockThreshold: number
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [newItem, setNewItem] = useState({ 
    name: "", 
    quantity: 0, 
    price: 0, 
    imageUrl: "", 
    lowStockThreshold: 10 
  })
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "price" | "quantity">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchInventory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    if (inventory.length) {
      applyFiltersAndSort()
    }
  }, [searchQuery, inventory, sortBy, sortOrder, filterLowStock])

  const applyFiltersAndSort = () => {
    let results = [...inventory]
    
    // Apply search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      results = results.filter(item => 
        item.name.toLowerCase().includes(lowerCaseQuery)
      )
    }
    
    // Apply low stock filter
    if (filterLowStock) {
      results = results.filter(item => item.quantity <= item.lowStockThreshold)
    }
    
    // Apply sorting
    results.sort((a, b) => {
      let comparison = 0
      
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === "price") {
        comparison = a.price - b.price
      } else if (sortBy === "quantity") {
        comparison = a.quantity - b.quantity
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    setFilteredInventory(results)
  }

  const fetchInventory = async () => {
    setIsLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInventory(response.data)
      setFilteredInventory(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching inventory:", error)
      setError("Failed to load inventory. Please try again.")
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      await axios.post("/api/inventory", newItem, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNewItem({ name: "", quantity: 0, price: 0, imageUrl: "", lowStockThreshold: 10 })
      setIsFormOpen(false)
      fetchInventory()
    } catch (error) {
      console.error("Error adding item:", error)
      setError("Failed to add item. Please try again.")
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const token = localStorage.getItem("token")
      await axios.put("/api/inventory", editingItem, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingItem(null)
      setIsFormOpen(false)
      fetchInventory()
    } catch (error) {
      console.error("Error updating item:", error)
      setError("Failed to update item. Please try again.")
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const token = localStorage.getItem("token")
      await axios.delete("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        data: { itemId },
      })
      fetchInventory()
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("Failed to delete item. Please try again.")
    }
  }

  const openEditForm = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const openAddForm = () => {
    setEditingItem(null)
    setNewItem({ name: "", quantity: 0, price: 0, imageUrl: "", lowStockThreshold: 10 })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
  }

  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen)
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const renderInventoryForm = () => (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </h2>
            <button 
              onClick={closeForm}
              className="p-1 rounded-full hover:bg-gray-100 transition"
              aria-label="Close form"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                id="name"
                value={editingItem ? editingItem.name : newItem.name}
                onChange={(e) =>
                  editingItem
                    ? setEditingItem({ ...editingItem, name: e.target.value })
                    : setNewItem({ ...newItem, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="0"
                  value={editingItem ? editingItem.quantity : newItem.quantity}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, quantity: Number(e.target.value) })
                      : setNewItem({ ...newItem, quantity: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  min="0"
                  step="0.01"
                  value={editingItem ? editingItem.price : newItem.price}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, price: Number(e.target.value) })
                      : setNewItem({ ...newItem, price: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                id="imageUrl"
                value={editingItem ? editingItem.imageUrl : newItem.imageUrl}
                onChange={(e) =>
                  editingItem
                    ? setEditingItem({ ...editingItem, imageUrl: e.target.value })
                    : setNewItem({ ...newItem, imageUrl: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                id="lowStockThreshold"
                min="1"
                value={editingItem ? editingItem.lowStockThreshold : newItem.lowStockThreshold}
                onChange={(e) =>
                  editingItem
                    ? setEditingItem({ ...editingItem, lowStockThreshold: Number(e.target.value) })
                    : setNewItem({ ...newItem, lowStockThreshold: Number(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingItem ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  const renderInventoryCard = (item: InventoryItem) => {
    const isLowStock = item.quantity <= item.lowStockThreshold;
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        key={item._id} 
        className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md border border-gray-100"
      >
        <div className="relative h-48 overflow-hidden group">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isLowStock && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock
            </div>
          )}
        </div>
        
        <div className="p-5">
          <h3 className="font-semibold text-lg mb-3 line-clamp-1">{item.name}</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-700">
              <Package className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium">{item.quantity} in stock</span>
            </div>
            <div className="flex items-center text-gray-700">
              <DollarSign className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => openEditForm(item)}
              className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 text-sm font-medium transition flex items-center justify-center group"
            >
              <Edit className="h-4 w-4 mr-1 text-blue-500 group-hover:animate-pulse" />
              Edit
            </button>
            <button
              onClick={() => handleDeleteItem(item._id)}
              className="flex-1 py-2 px-3 bg-gray-50 hover:bg-red-50 rounded-lg text-gray-700 group-hover:text-red-600 text-sm font-medium transition flex items-center justify-center group"
            >
              <Trash2 className="h-4 w-4 mr-1 text-gray-500 group-hover:text-red-500" />
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header with Shadow on Scroll */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <Package className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              </div>
              
              <button
                onClick={openAddForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Item
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Search, Filters and Sort */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inventory items..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={toggleFilterMenu}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-500" />
                    Filters
                    <ChevronDown className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isFilterMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-sm text-gray-700">Filter Options</p>
                      </div>
                      <div className="px-4 py-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filterLowStock}
                            onChange={() => setFilterLowStock(!filterLowStock)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Show low stock items only</span>
                        </label>
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100">
                        <p className="font-medium text-sm text-gray-700 mb-2">Sort by</p>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              checked={sortBy === "name"}
                              onChange={() => setSortBy("name")}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Name</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              checked={sortBy === "price"}
                              onChange={() => setSortBy("price")}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Price</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              checked={sortBy === "quantity"}
                              onChange={() => setSortBy("quantity")}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Quantity</span>
                          </label>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button 
                          onClick={toggleSortOrder}
                          className="w-full text-left flex items-center text-sm"
                        >
                          <span>Order: </span>
                          <span className="ml-2 font-medium">
                            {sortOrder === "asc" ? "Ascending" : "Descending"}
                          </span>
                          <ChevronDown className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${sortOrder === "desc" ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={fetchInventory}
                  className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  aria-label="Refresh inventory"
                >
                  <RefreshCcw className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button 
                  className="ml-auto" 
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X className="h-5 w-5 text-red-500" />
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Results Summary */}
          {!isLoading && filteredInventory.length > 0 && (
            <div className="mb-4 text-sm text-gray-500">
              Showing {filteredInventory.length} of {inventory.length} items
              {filterLowStock ? " (Low stock only)" : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </div>
          )}
          
          {/* Inventory Grid */}
          {isLoading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-500 font-medium">Loading inventory...</p>
            </div>
          ) : filteredInventory.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredInventory.map(renderInventoryCard)}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-xl shadow-sm"
            >
              <Package className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">No items found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                {searchQuery 
                  ? "Try adjusting your search terms or filters" 
                  : filterLowStock 
                    ? "No items below their threshold quantity" 
                    : "Get started by adding your first inventory item"}
              </p>
              {!searchQuery && !filterLowStock && (
                <div className="mt-6">
                  <button
                    onClick={openAddForm}
                    className="inline-flex items-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Item
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Form Modal */}
      {isFormOpen && renderInventoryForm()}
    </NavbarLayout>
  )
}